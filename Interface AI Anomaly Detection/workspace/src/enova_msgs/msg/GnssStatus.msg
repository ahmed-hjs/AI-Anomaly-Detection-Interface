uint8 numSV # number of satellite used in Nav Solution

uint8 fixType  # GNSSfix type.
               #   0: no fix,
               #   1: dead reckoning only,
               #   2: 2D-fix,
               #   3: 3D-fix,
               #   4:GNSS+dead reckoning,
               #   5: time only fix

bool diffMode              # 1: dgnss mode

uint8 diffSource # Differential gnss solution type
                  #   0: none,
                  #   1: SBAS,
                  #   2: GBAS,
                  #   3: RTK-wide, (base line > 12.5km)
                  #   4: RTK-narrow, (base line < 12.5km)
                  #   5: SBAS+PPP

uint8 carrierStatus # Carrier phase range solution status.
               #   0: no carrier phase range solution,
               #   1: float solution,
               #   2: fixed solution


