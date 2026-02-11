import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationStore } from '../notifications/notification.store';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  // Use inject() to get the service inside the interceptor function
  const notificationStore = inject(NotificationStore);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Une erreur inconnue est survenue';
      let errorTitle = 'Erreur';
      
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Erreur: ${error.error.message}`;
      } else {
        // Server-side error
        if (error.status === 0) {
          errorTitle = 'Erreur de connexion';
          errorMessage = 'Impossible de contacter le serveur.';
        } else if (error.status >= 500) {
          errorTitle = 'Erreur serveur';
          errorMessage = 'Une erreur inattendue est survenue. Veuillez réessayer plus tard.';
        } else if (error.status === 400) {
            // 400 errors are often form validation errors, handled by the component.
            // Only show a toast if it's a generic 400 or we want to force it.
            // For now, let's log it but not spam the user if the form shows the error.
            // Uncomment below to show toast for 400s too.
            // errorTitle = 'Requête invalide';
            // errorMessage = error.error?.message || 'Les données envoyées sont invalides.';
        } else if (error.status === 404) {
           errorTitle = 'Introuvable';
           errorMessage = 'La ressource demandée n\'existe pas.';
        }
      }

      // Only show toast for 5xx and connection errors (status 0) automatically
      if (error.status === 0 || error.status >= 500) {
        notificationStore.addNotification({
          type: 'error',
          title: errorTitle,
          message: errorMessage
        });
      }
      
      return throwError(() => error);
    })
  );
};
