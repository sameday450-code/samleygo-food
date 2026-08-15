import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(
    buffer: Buffer,
    originalName: string,
  ): Promise<{ url: string }> {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('No file data provided');
    }

    const result = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'food-delivery',
            resource_type: 'image',
            public_id: `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
            format: 'jpg',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as any);
          },
        );

        stream.end(buffer);
      },
    );

    return { url: result.secure_url };
  }
}
