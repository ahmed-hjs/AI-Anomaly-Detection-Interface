uint32 iTOW # [ms] GPS time of week of the navigation epoch

uint16 year # [y] Year UTC
uint8 month # [mon: 1..12] Year UTC
uint8 day   # [d: 1..31] day of year UTC
uint8 hour  # [h: 0..23] hour of day UTC
uint8 min   # [min: 0..59] Minute of hour UTC
uint8 sec   # [s: 0..60] Seconds of minute UTC
int32 nano  # [ns -1e9..1e9] Fraction of second (nanosecond)
uint32 tAcc # [ns] Time accurcy UTC

bool validDate # 1: valid UTC date
bool validTime # 1: valid UTC time of day
bool fullyResolved # 1: UTC time of day has been fully resolved (no seconds uncertainty)
