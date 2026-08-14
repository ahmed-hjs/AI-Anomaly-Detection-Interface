# NAV-HPPOSLLH (0x01 0x14)
# Geodetic Position Solution
#
# See important comments concerning validity of position given in section
# Navigation Output Filters.
# This message outputs the Geodetic position in the currently selected 
# Ellipsoid. The default is the WGS84 Ellipsoid, but can be changed with the
# message CFG-DAT.
#

uint8 CLASS_ID = 1
uint8 MESSAGE_ID = 20

uint8 version           # Message version (0 for this version)
uint8[3] reserved1
uint32 iTOW             # GPS Millisecond Time of Week [ms]

int32 lon               # Longitude [deg / 1e-7]
int32 lat               # Latitude [deg / 1e-7]
int32 height            # Height above Ellipsoid [mm]
int32 hMSL              # Height above mean sea level [mm]
int8 lonHp              # High precision component of longitude. Must be in the range -99..+99. Precise longitude in deg * 1e-7 = lon + (lonHp * 1e-2). [deg / 1e-9]
int8 latHp              # High precision component of latitude. Must be in the range -99..+99. Precise latitude in deg * 1e-7 = lat + (latHp * 1e-2). [deg / 1e-9]
int8 heightHp           # High precision component of height above ellipsoid. Must be in the range -9..+9. Precise height in mm = height + (heightHp * 0.1). [mm / 0.01]
int8 hMSLHp             # High precision component of height above mean sea level. Must be in the range -9..+9. Precise height in mm = hMSL + (hMSLHp * 0.1). [mm / 0.01]
uint32 hAcc             # Horizontal Accuracy Estimate [mm]
uint32 vAcc             # Vertical Accuracy Estimate [mm]
