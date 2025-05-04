export const monitoringItems = [
  {
    key: "ultrasonic",
    icon: "mdi:proximity-sensor",
    status: "normal",
    title: "Ultrasonic Reading",
    value: "0.48 m",
  },
  {
    key: "gps",
    icon: "fa6-solid:compass",
    status: "normal",
    title: "IMU Heading Direction",
    value: "118° SE",
  },
  {
    key: "obstacle",
    icon: "mynaui:danger-triangle-solid",
    status: "warning",
    title: "Obstacle Detection Alert",
    value: "0.48m • Medium",
  },
  {
    key: "battery",
    icon: "fluent:battery-9-32-regular",
    status: "danger",
    title: "Battery Status",
    value: "25%",
  },
] as const;
