<?php

if (!function_exists('convertToSeconds')) {
    function convertToSeconds($duration)
    {
        [$hours, $minutes, $seconds] = explode(':', $duration);
        return ($hours * 3600) + ($minutes * 60) + $seconds;
    }
}

if (!function_exists('convertToHHMMSS')) {
    function convertToHHMMSS($seconds)
    {
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds % 3600) / 60);
        $seconds = $seconds % 60;

        return sprintf('%02d:%02d:%02d', $hours, $minutes, $seconds);
    }
}

if (!function_exists('paceToSeconds')) {
    function paceToSeconds($pace)
    {
        [$minutes, $seconds] = explode(':', $pace);
        return ($minutes * 60) + $seconds;
    }
}

if (!function_exists('secondsToPace')) {
    function secondsToPace($seconds)
    {
        $minutes = floor($seconds / 60);
        $remainingSeconds = $seconds % 60;

        return sprintf('%02d:%02d', $minutes, $remainingSeconds);
    }
}
