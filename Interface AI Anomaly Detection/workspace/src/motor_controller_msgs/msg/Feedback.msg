Header header

# From PGN 0xFA20
float32 duty_cycle        # -1.0 .. 1.0 (duty cycle fraction)
float32 erpm              # electrical RPM
float32 motor_current     # [A]
float32 battery_current   # [A]
float32 board_temp        # [°C]
float32 motor_temp        # [°C]

# From PGN 0xFA21
float32 battery_voltage   # [V]
float32 adc1              # [V]
float32 adc2              # [V]
float32 adc15             # [V]  ← often adc3 in VESC
uint8   state             # VESC state code

# From PGN 0xFA22
float32 motor_torque      # [Nm]
float32 motor_iq          # [A]
float32 motor_id          # [A]

# From PGN 0xFA23
float32 speed             # [km/s] 
float32 odo               # [km]
float32 rpm               # mechanical RPM