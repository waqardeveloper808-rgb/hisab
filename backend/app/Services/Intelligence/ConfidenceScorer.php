<?php

namespace App\Services\Intelligence;

class ConfidenceScorer
{
    public function score(int $suggestions, int $anomalies, int $criticalAnomalies, int $reminders, int $signalStrength = 0): int
    {
        $score = 64 + ($suggestions * 5) + ($reminders * 2) + $signalStrength - ($anomalies * 7) - ($criticalAnomalies * 15);

        return max(0, min(100, $score));
    }
}