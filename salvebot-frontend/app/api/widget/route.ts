import { readFile } from 'fs/promises';
import { join } from 'path';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Read the widget.js file from public directory
    const filePath = join(process.cwd(), 'public', 'widget.js');
    const fileContents = await readFile(filePath, 'utf8');

    return new Response(fileContents, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error serving widget:', error);
    return new Response('Widget not found', { status: 404 });
  }
}