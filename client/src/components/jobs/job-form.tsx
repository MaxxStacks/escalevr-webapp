import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertJobSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import PhotoUpload from "./photo-upload";
import { Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

// Extended schema with additional validation
const jobFormSchema = insertJobSchema.extend({
  dateScheduled: z.date().optional(),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

interface JobFormProps {
  onClose: () => void;
  existingJob?: any; // For editing existing jobs
}

export default function JobForm({ onClose, existingJob }: JobFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploadedPhotos, setUploadedPhotos] = useState<any[]>([]);
  
  // Fetch clients
  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/users/role/client"],
  });
  
  // Fetch technicians
  const { data: technicians, isLoading: techniciansLoading } = useQuery({
    queryKey: ["/api/users/role/technician"],
  });
  
  // Fetch units based on selected client
  const [selectedClientId, setSelectedClientId] = useState<number | null>(
    existingJob?.clientId || null
  );
  
  const { data: units, isLoading: unitsLoading } = useQuery({
    queryKey: ["/api/units", selectedClientId],
    enabled: !!selectedClientId,
  });
  
  // Form definition
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: existingJob || {
      unitId: 0,
      clientId: 0,
      type: "regular",
      status: "scheduled",
      description: "",
      technicianId: null,
      dateScheduled: null,
      notes: "",
      clientVisible: true,
    },
  });
  
  // Create or update job mutation
  const jobMutation = useMutation({
    mutationFn: async (values: JobFormValues) => {
      // If editing, update the job
      if (existingJob) {
        await apiRequest("PATCH", `/api/jobs/${existingJob.id}`, values);
        return existingJob.id;
      } 
      // Otherwise create a new job
      else {
        const res = await apiRequest("POST", "/api/jobs", values);
        const job = await res.json();
        return job.id;
      }
    },
    onSuccess: (jobId) => {
      // Upload photos if any
      if (uploadedPhotos.length > 0) {
        uploadedPhotos.forEach(photo => {
          const formData = new FormData();
          formData.append('photo', photo.file);
          formData.append('entityType', 'job');
          formData.append('entityId', jobId.toString());
          formData.append('caption', photo.caption || '');
          formData.append('clientVisible', 'true');
          formData.append('uploadedBy', user?.id.toString() || '0');
          
          // Upload each photo
          fetch('/api/photos', {
            method: 'POST',
            body: formData,
            credentials: 'include'
          });
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      
      toast({
        title: existingJob ? "Job updated" : "Job created",
        description: `Job has been ${existingJob ? "updated" : "created"} successfully.`,
      });
      
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${existingJob ? "update" : "create"} job: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle client change
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(parseInt(clientId));
  };
  
  // Form submission
  const onSubmit = (values: JobFormValues) => {
    jobMutation.mutate(values);
  };
  
  const isLoading = clientsLoading || techniciansLoading || (!!selectedClientId && unitsLoading);
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Selection */}
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(parseInt(value));
                        handleClientChange(value);
                      }}
                      defaultValue={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.map((client: any) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Unit Selection */}
              <FormField
                control={form.control}
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value ? field.value.toString() : undefined}
                      disabled={!selectedClientId || !units?.length}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !selectedClientId 
                              ? "Select a client first" 
                              : !units?.length 
                                ? "No units available" 
                                : "Select a unit"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units?.map((unit: any) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.year} {unit.make} {unit.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Job Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="regular">Regular Service</SelectItem>
                        <SelectItem value="warranty">Warranty</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="PDI">PDI (Pre-Delivery Inspection)</SelectItem>
                        <SelectItem value="DAF">DAF</SelectItem>
                        <SelectItem value="seasonal">Seasonal (Spring/Winter)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="awaiting_parts">Awaiting Parts</SelectItem>
                        <SelectItem value="awaiting_approval">Awaiting Approval</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Technician */}
              <FormField
                control={form.control}
                name="technicianId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technician</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                      defaultValue={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Assign a technician" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {technicians?.map((tech: any) => (
                          <SelectItem key={tech.id} value={tech.id.toString()}>
                            {tech.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Schedule Date */}
              <FormField
                control={form.control}
                name="dateScheduled"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Schedule Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={
                              "pl-3 text-left font-normal " +
                              (!field.value && "text-muted-foreground")
                            }
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter job description"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter additional notes"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Client Visibility */}
            <FormField
              control={form.control}
              name="clientVisible"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Visible to client</FormLabel>
                    <p className="text-xs text-gray-500">
                      If checked, the client will be able to see this job in their dashboard
                    </p>
                  </div>
                </FormItem>
              )}
            />
            
            {/* Photo Upload */}
            <div className="space-y-2">
              <FormLabel>Photos</FormLabel>
              <PhotoUpload
                onPhotosChange={setUploadedPhotos}
                existingPhotos={existingJob?.photos || []}
              />
            </div>
          </>
        )}
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={jobMutation.isPending}>
            {jobMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {existingJob ? "Updating..." : "Creating..."}
              </>
            ) : (
              existingJob ? "Update Job" : "Create Job"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
