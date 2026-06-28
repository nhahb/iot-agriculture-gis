import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import {
  Thermometer,
  Droplets,
  Battery,
  Wifi,
  MapPin,
} from "lucide-react";

const fakeSensors = [
  {
    id: 1,
    name: "Sensor Tomato 01",
    location: "Zone A",
    temperature: 29.4,
    humidity: 74,
    battery: 87,
    status: "online",
    updated_at: "2026-05-29T22:30:00",
  },
  {
    id: 2,
    name: "Sensor Lettuce 02",
    location: "Zone B",
    temperature: 27.1,
    humidity: 81,
    battery: 62,
    status: "online",
    updated_at: "2026-05-29T22:28:00",
  },
  {
    id: 3,
    name: "Sensor Rice 03",
    location: "Zone C",
    temperature: 31.6,
    humidity: 68,
    battery: 20,
    status: "offline",
    updated_at: "2026-05-29T20:10:00",
  },
  {
    id: 4,
    name: "Sensor Corn 04",
    location: "Zone D",
    temperature: 26.8,
    humidity: 77,
    battery: 93,
    status: "online",
    updated_at: "2026-05-29T22:31:00",
  },
];

const Device = () => {
  const getStatusVariant = (status) => {
    switch (status) {
      case "online":
        return "default";

      case "offline":
        return "destructive";

      default:
        return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Sensors Dashboard
          </h1>

          <p className="text-muted-foreground mt-2">
            Smart agriculture monitoring system
          </p>
        </div>

        {/* Sensor Cards */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">

          {fakeSensors?.map((sensor) => (
            <Card
              key={sensor.id}
              className="rounded-2xl shadow-sm hover:shadow-md transition-all"
            >

              <CardHeader className="flex flex-row items-start justify-between">

                <div>
                  <CardTitle className="text-lg">
                    {sensor.name}
                  </CardTitle>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4" />
                    {sensor.location}
                  </div>
                </div>

                <Badge variant={getStatusVariant(sensor.status)}>
                  {sensor.status}
                </Badge>

              </CardHeader>

              <CardContent className="space-y-5">

                {/* Temperature */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Thermometer className="w-5 h-5" />
                    Temperature
                  </div>

                  <span className="text-xl font-bold">
                    {sensor.temperature}°C
                  </span>
                </div>

                {/* Humidity */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Droplets className="w-5 h-5" />
                    Humidity
                  </div>

                  <span className="text-xl font-bold">
                    {sensor.humidity}%
                  </span>
                </div>

                {/* Battery */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Battery className="w-5 h-5" />
                    Battery
                  </div>

                  <span className="text-xl font-bold">
                    {sensor.battery}%
                  </span>
                </div>

                {/* Signal */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Wifi className="w-5 h-5" />
                    Signal
                  </div>

                  <span className="text-sm font-medium text-green-600">
                    Strong
                  </span>
                </div>

                {/* Last Update */}
                <div className="pt-3 border-t text-sm text-muted-foreground">
                  Last update:
                  <div className="font-medium text-foreground mt-1">
                    {new Date(sensor.updated_at).toLocaleString()}
                  </div>
                </div>

              </CardContent>
            </Card>
          ))}

        </div>
      </div>
    </div>
  );
};

export default Device;