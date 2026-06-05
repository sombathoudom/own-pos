<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Encoders\JpegEncoder;
use Intervention\Image\Laravel\Facades\Image;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ProductImageController extends Controller
{
    public function __invoke(
        Request $request,
        string $filename,
    ): BinaryFileResponse {
        $width = (int) $request->query('w', 400);

        /*
         * Prevent invalid or extremely large values.
         */
        $width = max(100, min($width, 1600));

        $sourceRelativePath = 'products/'.$filename;

        abort_unless(
            Storage::disk('public')->exists($sourceRelativePath),
            404,
        );

        $sourcePath = Storage::disk('public')->path(
            $sourceRelativePath,
        );

        /*
         * Include the source modified time so a replaced image
         * automatically creates a new cached version.
         */
        $modifiedAt = filemtime($sourcePath);

        $baseName = pathinfo(
            $filename,
            PATHINFO_FILENAME,
        );

        $generatedFilename = sprintf(
            '%s-w%d-%d.jpg',
            $baseName,
            $width,
            $modifiedAt,
        );

        $generatedRelativePath = 'products/'.$generatedFilename;

        if (
            ! Storage::disk('public')->exists(
                $generatedRelativePath,
            )
        ) {
            /*
             * Intervention Image v4: decodePath reads the file,
             * scaleDown resizes preserving aspect ratio, and
             * encode compresses to JPEG at quality 82.
             */
            $encodedImage = Image::decodePath($sourcePath)
                ->scaleDown(width: $width)
                ->encode(new JpegEncoder(quality: 82));

            Storage::disk('public')->put(
                $generatedRelativePath,
                (string) $encodedImage,
            );
        }

        $generatedPath = Storage::disk('public')->path(
            $generatedRelativePath,
        );

        return response()->file($generatedPath, [
            'Content-Type' => 'image/jpeg',
            'Cache-Control' => 'public, max-age=604800, immutable',
            'Access-Control-Allow-Origin' => '*',
            'Vary' => 'Origin',
        ]);
    }
}
