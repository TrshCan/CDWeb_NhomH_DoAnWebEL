<?php

namespace App\GraphQL\Resolvers;

use App\Models\Event;
use App\Models\User;

class EventResolver
{
    public function createEvent($_, array $args)
    {
        // Lấy input
        $input = $args['input'];

        // User mặc định = 1
        $user = User::find(1);

        // Tạo event mới
        $event = Event::create([
            'title' => $input['title'],
            'event_date' => $input['event_date'],
            'location' => $input['location'] ?? null,
            'created_by' => $user->id,
            'created_at' => now()
        ]);

        return $event;
    }
}