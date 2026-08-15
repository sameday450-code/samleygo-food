import { Controller, Get, Query, Res, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';

@Controller('image-proxy')
export class ImageProxyController {
  @Get()
  async proxy(@Query('url') url: string, @Res() res: Response) {
    if (!url) {
      throw new BadRequestException('url query parameter is required');
    }

    // Only allow Cloudinary URLs for security
    if (!url.startsWith('https://res.cloudinary.com/')) {
      throw new BadRequestException('Only Cloudinary URLs are allowed');
    }

    try {
      const response = await fetch(url);

      if (!response.ok) {
        return res.status(response.status).send('Image not found');
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const buffer = await response.arrayBuffer();

      res.set({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      });

      res.send(Buffer.from(buffer));
    } catch {
      throw new BadRequestException('Failed to fetch image');
    }
  }
}
