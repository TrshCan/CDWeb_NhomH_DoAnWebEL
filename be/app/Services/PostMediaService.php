<?php

namespace App\Services;

use App\Repositories\PostMediaRepository;
use App\Repositories\PostRepository;
use Illuminate\Support\Facades\Storage;
use App\Models\PostMedia;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class PostMediaService
{
    protected $postMediaRepository;
    protected $postRepository;

    public function __construct(PostMediaRepository $postImageRepository, PostRepository $postRepository)
    {
        $this->postImageRepository = $postImageRepository;
        $this->postIRepository = $postRepository;
    }

    public function uploadMedia($postId, UploadedFile $file)
    {
        // Validate post existence
        $post = $this->postRepository->find($postId);
        if (!$post) {
            throw ValidationException::withMessages(['post_id' => 'Post not found']);
        }

        // validate file type (allow image/video)
        $mime = $file->getMimeType();
        if (!preg_match('/^(image|video)\//', $mime)) {
            throw ValidationException::withMessages(['file' => 'Only image or video files are allowed']);
        }

        // store the file
        $path = $file->store('posts', 'public');
        $url = Storage::url($path);

        // save record
        $postImage = PostMedia::create([
            'post_id' => $postId,
            'url' => $url,
        ]);

        return $postImage;
    }
}
