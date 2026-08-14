# Information acquired from ublox Nav::PVT message
#
#

float64 lon    # [deg] longitude (1e-7 resolution) (1e-9 with RTK)
float64 lat    # [deg] latitude (1e-7 resolution) (1e-9 with RTK)
float64 height # [m] height above ellipsoid WGS84 (resolution 1mm) (0.1 mm with RTK)
float64 hMSL   # [m] height above Mean Sea Level (resolution 1mm) ( 0.1 mm with RTK)

float32 velN   # [m/s] NED north velocity (resolution mm/s)
float32 velE   # [m/s] NED east velocity (resolution mm/s)
float32 velD   # [m/s] NED down velocity (resolution mm/s)
float32 gSpeed # [m/s] Ground 2-D speed (resolution mm/s)

float32 horAcc   # [m] horizontal accuracy estimate at 1-sigma (resolution 0.1mm)
float32 verAcc   # [m] vertical accuracy estimate at 1-sigma (resolution 0.1mm)
float32 velAcc   # [m/s] velocity accuracy estimate at 1-sigma (resolution mm/s)

float32 motionHeading     # [deg] heading of motion (track) (resolution 1e-5 deg)
float32 motionHeadingAcc  # [deg] heading of motion (track) (resolution 1e-5 deg)
float32 vehiculeHeading   # [deg]
bool vehiculeHeadingValid # heading of vehicule is valid

float32 magDec    # [deg] Magnetic declinaison (resolution 1e-2deg)
float32 magDecAcc # [deg] Magnetic declinaison accuracy (resolution 1e-2deg)
bool magDecValid     # 1: valid magnetic declinaison
