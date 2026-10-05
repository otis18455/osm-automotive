<?php
// Kopieer dit bestand naar config.php en vul je Inmotiv-sleutel in. Zet config.php nooit online in git.
return [
  'api_key'         => 'JOUW_API_SLEUTEL',
  'blocks'          => 'BR', // B = basisgegevens (€0,06), R = inschrijving/bouwjaar (€0,10). Controleer bij Inmotiv hoe blokken gecombineerd worden.
  'max_per_ip_hour' => 3,    // per bezoeker per uur
  'max_per_ip_day'  => 6,    // per bezoeker per dag
  'max_per_day'     => 100,  // totaal per dag = kostenplafond (100 x €0,16 = max. €16 per dag)
  'cache_hours'     => 24,   // dezelfde plaat opnieuw opzoeken binnen 24 uur is gratis
];
