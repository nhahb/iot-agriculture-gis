import { axiosPrivate } from "../api/axios";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  User,
  Mail,
  Phone,
  Shield,
  MapPin,
  Leaf,
  Cpu,
  Bell,
  Lock,
  Activity
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosPrivate.get("/user/account");
        console.log("User data fetched:", response.data);
        setUsers(response.data.user);
      } catch (error) {
        toast.error("Failed to fetch user data");
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const handleEdit = async () => {
    try {
      const response = await axiosPrivate.post('/user/account', JSON.stringify(users));
      console.log("User data updated:", response.data);
      toast.success("User data updated successfully");
      setIsEditing(false);
    } catch (error) {
        toast.error("Failed to update user data");
      console.error("Error updating user data:", error);
    }
  };

  return (
        <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800">
            My Profile
          </h1>

          <p className="text-slate-500 mt-2">
            Manage your smart farming account
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

          {/* Personal Info */}
          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} />
                Personal Info
              </CardTitle>

              <CardDescription>
                Your account information
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Full Name</p>
                {
                    isEditing ? (
                        <Input value = {users.name} onChange={(e) => setUsers({...users, name: e.target.value})} />
                    ) : (
                        <p className="font-medium">{users.name}</p>
                    )
                }
              </div>

              {
                  isEditing ? (
                      <div className="flex items-center gap-2">
                        <Mail size={16} />
                        <Input value = {users.email} onChange={(e) => setUsers({...users, email: e.target.value})} />
                      </div>
                  ) : (
                      <div className="flex items-center gap-2">
                        <Mail size={16} />
                        <p>{users.email}</p>
                      </div>
                  )
              }

              {
                  isEditing ? (
                      <div className="flex items-center gap-2">
                        <Phone size={16} />
                        <Input value = {users.phone} onChange={(e) => setUsers({...users, phone: e.target.value})} />
                      </div>
                  ) : (
                      <div className="flex items-center gap-2">
                        <Phone size={16} />
                        <p>{users.phone}</p>
                      </div>
                  )
              }

              {
                  isEditing ? (
                      <div className="flex items-center gap-2">
                        <Shield size={16} />
                        <Input value = {users.role} onChange={(e) => setUsers({...users, role: e.target.value})} />
                      </div>
                  ) : (
                      <div className="flex items-center gap-2">
                        <Shield size={16} />
                        <p className="capitalize">{users.role}</p>
                      </div>
                  )
              }
              
              <Button variant="outline" className="w-full rounded-xl" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>

              {isEditing && (
                <Button className="w-full mt-3 rounded-xl" onClick={handleEdit}>
                  Save Changes
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Farm Info */}
          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf size={20} />
                Farm Info
              </CardTitle>

              <CardDescription>
                Information about your farm
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">

              <div>
                <p className="text-sm text-slate-500">
                  Farm Name
                </p>

                <p className="font-medium">
                  {/* {account.farm.name} */}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Crop Type
                </p>

                <p className="font-medium">
                  {/* {account.farm.cropType} */}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <MapPin size={16} />
                {/* <p>{account.farm.location}</p> */}
              </div>

            </CardContent>
          </Card>

          {/* Device Stats */}
          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu size={20} />
                Devices
              </CardTitle>

              <CardDescription>
                Connected IoT devices
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">

              <div className="flex justify-between">
                <span>Total Devices</span>
                <span className="font-bold">
                  {/* {account.devices.total} */}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Online</span>

                <span className="font-bold text-green-600">
                  {/* {account.devices.online} */}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Offline</span>

                <span className="font-bold text-red-500">
                  {/* {account.devices.offline} */}
                </span>
              </div>

            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell size={20} />
                Notifications
              </CardTitle>

              <CardDescription>
                Alert information
              </CardDescription>
            </CardHeader>

            <CardContent>

              <div className="flex justify-between items-center">
                <span>Alerts Today</span>

                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                  {/* {account.alertsToday} */}
                </span>
              </div>

            </CardContent>
          </Card>

          {/* Water Usage */}
          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity size={20} />
                Water Usage
              </CardTitle>

              <CardDescription>
                Daily consumption
              </CardDescription>
            </CardHeader>

            <CardContent>

              <div className="text-5xl font-bold text-slate-800">
                {/* {account.waterUsage} */}
              </div>

              <p className="text-slate-500 mt-2">
                Used today
              </p>

            </CardContent>
          </Card>

          {/* Security */}
          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock size={20} />
                Security
              </CardTitle>

              <CardDescription>
                Manage your account security
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">

              <Button
                variant="outline"
                className="w-full rounded-xl"
              >
                Change Password
              </Button>

              <Button
                variant="outline"
                className="w-full rounded-xl"
              >
                Two-factor Authentication
              </Button>

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Users;
