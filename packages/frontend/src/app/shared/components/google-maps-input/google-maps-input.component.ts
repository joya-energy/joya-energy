import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  AfterViewInit,
  ViewChild,
  forwardRef,
  signal,
  inject,
  PLATFORM_ID,
  Output,
  EventEmitter
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideMapPin, lucideLoader } from '@ng-icons/lucide';
import { environment } from '../../../../environments/environment';

// Interfaces for Google Solar API REST responses
interface SolarBuildingInsightsRequest {
  location: {
    latitude: number;
    longitude: number;
  };
}

interface SolarBuildingInsightsResponse {
  solarPotential?: SolarPotential;
  imageryAndYear?: ImageryAndYear;
}

interface SolarPotential {
  maxSolarPanelCount?: number;
  maxArrayAreaMeters2?: number;
  maxArrayPanelsCount?: number;
  roofSegmentStats?: RoofSegmentStats[];
}

interface RoofSegmentStats {
  pitchDegrees?: number;
  azimuthDegrees?: number;
  areaMeters2?: number;
}

interface ImageryAndYear {
  bounds?: any;
}

export interface AddressData {
  address: string;
  latitude: number;
  longitude: number;
}

export interface SolarInfo {
  maxSolarPanelCount: number;
  maxArrayAreaMeters2: number;
  maxArrayPanelsCount: number;
  roofSegmentStats: RoofSegmentStats[];
}

@Component({
  selector: 'app-google-maps-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIconComponent],
  templateUrl: './google-maps-input.component.html',
  styleUrl: './google-maps-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GoogleMapsInputComponent),
      multi: true
    },
    provideIcons({ lucideMapPin, lucideLoader })
  ]
})
export class GoogleMapsInputComponent implements ControlValueAccessor, OnInit, AfterViewInit {
  @ViewChild('addressInput', { static: false }) addressInput!: ElementRef<HTMLInputElement>;
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLDivElement>;
  @Output() addressSelected = new EventEmitter<AddressData>();

  private platformId = inject(PLATFORM_ID);
  private autocomplete: google.maps.places.Autocomplete | null = null;
  private map: google.maps.Map | null = null;
  private marker: google.maps.Marker | null = null;
  private googleMapsLoaded = false;

  protected selectedAddress = signal<AddressData | null>(null);
  protected showMap = signal(false);
  protected isLoading = signal(false);
  protected isAnalyzingSolar = signal(false);
  protected solarInfo = signal<SolarInfo | null>(null);
  protected solarAnalysisError = signal<string | null>(null);
  protected isDisabled = false;

  private onChange: (value: AddressData | null) => void = () => {};
  private onTouchedCallback: () => void = () => {};

  protected onTouched(): void {
    this.onTouchedCallback();
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadGoogleMapsScript();
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId) && this.googleMapsLoaded) {
      this.initializeAutocomplete();
    }
  }

  private loadGoogleMapsScript(): void {
    if (typeof google !== 'undefined' && google.maps) {
      console.log('Google Maps already loaded');
      this.googleMapsLoaded = true;
      if (this.addressInput?.nativeElement) {
        this.initializeAutocomplete();
      }
      return;
    }

    console.log('Loading Google Maps script...');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    (window as any).initGoogleMaps = () => {
      console.log('Google Maps loaded successfully');
      this.googleMapsLoaded = true;
      if (this.addressInput?.nativeElement) {
        this.initializeAutocomplete();
      }
    };

    document.head.appendChild(script);
  }

  private initializeAutocomplete(): void {
    if (!this.addressInput?.nativeElement) {
      console.error('Address input not found');
      return;
    }

    if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
      console.error('Google Maps Places API not loaded');
      return;
    }

    try {
      console.log('Initializing autocomplete...');
      this.autocomplete = new google.maps.places.Autocomplete(this.addressInput.nativeElement, {
        fields: ['formatted_address', 'geometry', 'name', 'address_components']
      });

      this.autocomplete.addListener('place_changed', () => {
        this.onPlaceChanged();
      });
      
      console.log('Autocomplete initialized successfully');
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
    }
  }

  private onPlaceChanged(): void {
    if (!this.autocomplete) return;

    const place = this.autocomplete.getPlace();
    if (!place.geometry?.location) return;

    const addressData: AddressData = {
      address: place.formatted_address || place.name || '',
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng()
    };

    this.selectedAddress.set(addressData);
    this.solarInfo.set(null); // Reset solar info when new address is selected
    this.onChange(addressData);
    this.onTouchedCallback();
    this.addressSelected.emit(addressData);

    if (this.showMap()) {
      this.updateMap(addressData);
    }
  }

  protected toggleMap(): void {
    this.showMap.update(v => !v);
    if (this.showMap() && this.selectedAddress()) {
      setTimeout(() => {
        this.initializeMap();
        // Automatically analyze solar potential when showing the map
        if (!this.solarInfo()) {
          this.analyzeSolarPotential();
        }
      }, 100);
    }
  }

  protected useCurrentLocation(): void {
    if (!navigator.geolocation) return;

    this.isLoading.set(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.reverseGeocode(latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        this.isLoading.set(false);
      }
    );
  }

  private reverseGeocode(lat: number, lng: number): void {
    if (typeof google === 'undefined' || !google.maps) {
      console.error('Google Maps not loaded');
      this.isLoading.set(false);
      return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      { location: { lat, lng } },
      (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        this.isLoading.set(false);
        if (status === 'OK' && results && results[0]) {
          const addressData: AddressData = {
            address: results[0].formatted_address,
            latitude: lat,
            longitude: lng
          };
          this.selectedAddress.set(addressData);
          this.solarInfo.set(null);
          this.onChange(addressData);
          this.addressSelected.emit(addressData);
          if (this.addressInput) {
            this.addressInput.nativeElement.value = addressData.address;
          }
          if (this.showMap()) {
            this.updateMap(addressData);
          }
        } else {
          console.error('Geocoding failed:', status);
        }
      }
    );
  }

  private initializeMap(): void {
    if (!this.mapContainer?.nativeElement || !this.selectedAddress()) return;

    const address = this.selectedAddress()!;
    const center = { lat: address.latitude, lng: address.longitude };

    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      center,
      zoom: 20,
      mapTypeId: 'satellite',
      tilt: 45,
      mapId: 'SOLAR_AUDIT_MAP'
    } as google.maps.MapOptions);

    this.marker = new google.maps.Marker({
      position: center,
      map: this.map,
      animation: google.maps.Animation.DROP
    });
  }

  private updateMap(address: AddressData): void {
    if (!this.map || !this.marker) {
      this.initializeMap();
      return;
    }

    const position = { lat: address.latitude, lng: address.longitude };
    this.map.setCenter(position);
    this.marker.setPosition(position);
  }

  protected analyzeSolarPotential(): void {
    if (!this.selectedAddress()) return;

    this.isAnalyzingSolar.set(true);
    this.solarAnalysisError.set(null);
    const address = this.selectedAddress()!;

    // Use Google Solar API REST endpoint
    const solarApiUrl = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${address.latitude}&location.longitude=${address.longitude}&key=${environment.googleMapsApiKey}`;

    fetch(solarApiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Solar API error: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then((result: SolarBuildingInsightsResponse) => {
        this.isAnalyzingSolar.set(false);
        this.solarAnalysisError.set(null);

        if (result && result.solarPotential) {
          const solarData = result.solarPotential;

          this.solarInfo.set({
            maxSolarPanelCount: solarData.maxSolarPanelCount ?? 0,
            maxArrayAreaMeters2: solarData.maxArrayAreaMeters2 ?? 0,
            maxArrayPanelsCount: solarData.maxArrayPanelsCount ?? 0,
            roofSegmentStats: solarData.roofSegmentStats ?? []
          });

            // Note: Solar layer visualization would require additional implementation
          // For now, we just store the data
          console.log('Solar analysis completed:', this.solarInfo());
        } else {
          this.solarAnalysisError.set('No solar potential data available for this location');
          console.warn('No solar potential data available for this location');
        }
      })
      .catch((error: unknown) => {
        console.error('Solar analysis error:', error);
        this.isAnalyzingSolar.set(false);
        this.solarAnalysisError.set('Solar analysis is currently unavailable. Please try again later.');
      });
  }


  writeValue(value: AddressData | null): void {
    if (value) {
      this.selectedAddress.set(value);
      if (this.addressInput) {
        this.addressInput.nativeElement.value = value.address;
      }
    } else {
      this.selectedAddress.set(null);
      if (this.addressInput) {
        this.addressInput.nativeElement.value = '';
      }
    }
  }

  registerOnChange(fn: (value: AddressData | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }
}

