"use client";

import { v4 as uuidv4 } from "uuid";
import { useState, useEffect } from "react";
import { Package, ArrowUpDown, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requestResources, Resource } from "@/app/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

export default function ResourcesPage() {
  const [selectedRequest, setSelectedRequest] =
    useState<requestResources | null>(null);
  const [allocateQuantity, setAllocateQuantity] = useState<number>(0);
  const [isAllocDialogOpen, setIsAllocDialogOpen] = useState(false);

  const [resources, setResources] = useState<Resource[]>([]);
  const [requestResource, setRequestResources] = useState<requestResources[]>(
    []
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      const { data, error } = await supabase.from("resources").select("*");
      if (error) {
        console.error("Error fetching alerts:", error);
      } else {
        setResources(data);
      }
    };

    fetchResources();
  }, []);
  useEffect(() => {
    const fetchResources = async () => {
      const { data, error } = await supabase
        .from("requestresources")
        .select("*");
      if (error) {
        console.error("Error fetching alerts:", error);
      } else {
        setRequestResources(data);
      }
    };

    fetchResources();
  }, []);
  const handleAddResource = async (newResource: Resource) => {
    const { data, error } = await supabase
      .from("resources")
      .insert([newResource])
      .select();
    if (error) {
      console.error("Error creating alert:", error);
    } else {
      setIsDialogOpen(false);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel("resources")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "resources" },
        (payload) => {
          setResources((prev) => [...prev, payload.new as Resource]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("requestresources")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "requestresources" },
        (payload) => {
          setRequestResources((prev) => [
            ...prev,
            payload.new as requestResources,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Resource Management</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>

          {/* <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Resource</DialogTitle>
              </DialogHeader>

              <ResourceForm onSubmit={handleAddResource} />
            </DialogContent>
          </Dialog> */}
        </div>
      </div>

      <div className="grid gap-4">
        {resources.map((resource) => (
          <Card key={resource.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                {resource.name}
              </CardTitle>
              <span
                className={`px-2 py-1 rounded-full text-sm ${
                  resource.status === "available"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                    : resource.status === "allocated"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                }`}
              >
                {resource.status.charAt(0).toUpperCase() +
                  resource.status.slice(1)}
              </span>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{resource.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">
                    {resource.quantity} {resource.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {resource.location.lat}, {resource.location.lng}
                  </p>
                </div>

                {resource.conditions && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Conditions</p>
                    <div className="flex gap-2 mt-1">
                      {resource.conditions.map((condition) => (
                        <span
                          key={condition}
                          className="px-2 py-1 bg-secondary rounded-full text-xs"
                        >
                          {condition}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {resource.expiryDate && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Expiry Date</p>
                    <p className="font-medium">{resource.expiryDate}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div>Requested Resources</div>
      <div className="grid gap-4">
        {requestResource.map((resource) => (
          <Card key={resource.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                {resource.name}
              </CardTitle>
              <span
                className={`px-2 py-1 rounded-full text-sm ${
                  resource.status === "requested"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                    : resource.status === "allocated"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                }`}
              >
                {resource.status.charAt(0).toUpperCase() +
                  resource.status.slice(1)}
              </span>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{resource.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">
                    {resource.quantity} {resource.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {resource.location.lat}, {resource.location.lng}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{resource.status}</p>
                </div>
                {resource.conditions && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Conditions</p>
                    <div className="flex gap-2 mt-1">
                      {resource.conditions.map((condition) => (
                        <span
                          key={condition}
                          className="px-2 py-1 bg-secondary rounded-full text-xs"
                        >
                          {condition}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {resource.expiryDate && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Expiry Date</p>
                    <p className="font-medium">{resource.expiryDate}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Requested By</p>
                  <p className="font-medium">
                    Jalpaiguri Superspeciality Hospital
                  </p>
                </div>
              </div>
              {resources.some(
                (res) =>
                  res.name === resource.name &&
                  res.type === resource.type &&
                  res.quantity > 0
              ) ? (
                <Button
                  onClick={() => {
                    setSelectedRequest(resource);
                    setIsAllocDialogOpen(true);
                  }}
                  disabled={resource.status === "allocated"}
                >
                  Allocate Resources
                </Button>
              ) : (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add Resource
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Resource</DialogTitle>
                    </DialogHeader>

                    <ResourceForm onSubmit={handleAddResource} />
                  </DialogContent>
                </Dialog>
              )}

              <Dialog
                open={isAllocDialogOpen}
                onOpenChange={setIsAllocDialogOpen}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Allocate Resource</DialogTitle>
                  </DialogHeader>
                  {selectedRequest && (
                    <div className="space-y-4">
                      <p>
                        Request for <strong>{selectedRequest.name}</strong> (
                        {selectedRequest.quantity} {selectedRequest.unit})
                      </p>

                      <div>
                        <Label>Allocate Quantity</Label>
                        <Input
                          type="number"
                          min={1}
                          max={
                            resources.find(
                              (res) => res.type === selectedRequest.type
                            )?.quantity || 0
                          }
                          value={allocateQuantity}
                          onChange={(e) =>
                            setAllocateQuantity(Number(e.target.value))
                          }
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Available:{" "}
                          {resources.find(
                            (res) => res.type === selectedRequest.type
                          )?.quantity || 0}{" "}
                          {selectedRequest.unit}
                        </p>
                      </div>

                      <Button
                        onClick={async () => {
                          const matchingResource = resources.find(
                            (res) => res.type === selectedRequest.type
                          );

                          if (
                            !matchingResource ||
                            allocateQuantity <= 0 ||
                            allocateQuantity > matchingResource.quantity
                          ) {
                            alert("Invalid allocation amount.");
                            return;
                          }
                          let updatedRequest: requestResources[] = [];
                          let reqError = null;

                          if (
                            selectedRequest.quantity - allocateQuantity <=
                            0
                          ) {
                            const { error: deleteError } = await supabase
                              .from("requestresources")
                              .delete()
                              .eq("id", selectedRequest.id);

                            reqError = deleteError;

                            setRequestResources((prev) =>
                              prev.filter((r) => r.id !== selectedRequest.id)
                            );
                          } else {
                            const { data, error } = await supabase
                              .from("requestresources")
                              .update({
                                quantity:
                                  selectedRequest.quantity - allocateQuantity,
                                status: "requested",
                              })
                              .eq("id", selectedRequest.id)
                              .select();

                            reqError = error;
                            updatedRequest = data || [];

                            if (!error && data) {
                              setRequestResources((prev) =>
                                prev.map((r) =>
                                  r.id === selectedRequest.id ? data[0] : r
                                )
                              );
                            }
                          }

                          const { data: updatedRes, error: resError } =
                            await supabase
                              .from("resources")
                              .update({
                                quantity:
                                  matchingResource.quantity - allocateQuantity,
                                status:
                                  matchingResource.quantity -
                                    allocateQuantity ===
                                  0
                                    ? "depleted"
                                    : matchingResource.status,
                              })
                              .eq("id", matchingResource.id)
                              .select();

                          if (reqError || resError) {
                            console.error(
                              "Error during allocation:",
                              reqError || resError
                            );
                            alert("Failed to allocate.");
                            return;
                          }

                          setRequestResources((prev) =>
                            prev.map((r) =>
                              r.id === selectedRequest.id
                                ? updatedRequest[0]
                                : r
                            )
                          );

                          setResources((prev) =>
                            prev.map((r) =>
                              r.id === matchingResource.id ? updatedRes[0] : r
                            )
                          );

                          setIsAllocDialogOpen(false);
                        }}
                      >
                        Confirm Allocation
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Form component for adding a new resource
interface ResourceFormProps {
  onSubmit: (resource: Resource) => void;
}

function ResourceForm({ onSubmit }: ResourceFormProps) {
  const [formData, setFormData] = useState<
    Omit<Resource, "id" | "lastUpdated">
  >({
    type: "food",
    name: "",
    quantity: 0,
    unit: "",
    location: { lat: 0, lng: 0 },
    status: "available",
    organizationId: "",
    expiryDate: "",
    conditions: [],
    // priority: "medium",
    // disasterType: "other",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.quantity <= 0 || !formData.unit) {
      alert("Please fill in all required fields");
      return;
    }

    const newResource: Resource = {
      ...formData,
      id: uuidv4(), // Generate a unique ID
      lastUpdated: new Date().toISOString(),
    };
    onSubmit(newResource);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label>Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value) =>
            setFormData({ ...formData, type: value as Resource["type"] })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="food">Food</SelectItem>
            <SelectItem value="medicine">Medicine</SelectItem>
            <SelectItem value="shelter">Shelter</SelectItem>
            <SelectItem value="equipment">Equipment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Quantity</Label>
        <Input
          type="number"
          value={formData.quantity}
          onChange={(e) =>
            setFormData({ ...formData, quantity: Number(e.target.value) })
          }
          required
        />
      </div>

      <div>
        <Label>Unit</Label>
        <Input
          value={formData.unit}
          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          required
        />
      </div>

      <div>
        <Label>Expiry Date</Label>
        <Input
          type="date"
          value={formData.expiryDate}
          onChange={(e) =>
            setFormData({ ...formData, expiryDate: e.target.value })
          }
        />
      </div>

      <div>
        <Label>Conditions</Label>
        <Input
          value={formData.conditions?.join(", ")}
          onChange={(e) =>
            setFormData({
              ...formData,
              conditions: e.target.value.split(", "),
            })
          }
          placeholder="Enter conditions separated by commas"
        />
      </div>

      <Button type="submit">Add Resource</Button>
    </form>
  );
}
