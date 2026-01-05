#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import { Logger } from '@backend/middlewares';

/**
 * Cleanup script to remove old PDF files from exports folder
 * Run this script periodically to clean up local storage after migration to cloud storage
 */

const EXPORTS_DIR = path.resolve(process.cwd(), 'exports');
const MAX_AGE_DAYS = 30; // Files older than 30 days will be deleted

function cleanupOldFiles() {
  Logger.info('Starting cleanup of old export files...');

  if (!fs.existsSync(EXPORTS_DIR)) {
    Logger.info('Exports directory does not exist, nothing to clean up');
    return;
  }

  const files = fs.readdirSync(EXPORTS_DIR);
  const now = Date.now();
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000; // Convert days to milliseconds

  let deletedCount = 0;
  let totalSize = 0;

  for (const file of files) {
    const filePath = path.join(EXPORTS_DIR, file);

    // Skip if not a file
    if (!fs.statSync(filePath).isFile()) {
      continue;
    }

    // Skip if not a PDF
    if (!file.endsWith('.pdf')) {
      continue;
    }

    const fileStats = fs.statSync(filePath);
    const fileAge = now - fileStats.mtime.getTime();

    if (fileAge > maxAge) {
      try {
        fs.unlinkSync(filePath);
        deletedCount++;
        totalSize += fileStats.size;
        Logger.info(`Deleted old file: ${file}`);
      } catch (error) {
        Logger.error(`Failed to delete file ${file}:`, error);
      }
    }
  }

  Logger.info(`Cleanup completed: ${deletedCount} files deleted, ${Math.round(totalSize / 1024 / 1024)} MB freed`);
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupOldFiles();
}

export { cleanupOldFiles };
