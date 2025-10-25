
'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, ListChecks, Search, Save, XCircle, RotateCcw, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import type { QAParameter, Parameter, SubParameter } from '@/types/qa-parameter';
import type { SOP } from '@/types/sop';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { getAuthHeaders } from '@/lib/authUtils';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Suspense } from 'react';
import type { SOPDocument } from '@/lib/sopService';
// Removed direct service imports - using API routes instead
import { QAParameterDocument } from '@/lib/models';

// Helper function to convert QAParameterDocument to QAParameter
function convertQAParameterDocumentToQAParameter(doc: QAParameterDocument): QAParameter {
  let lastModified: string;
  if (doc.updatedAt) {
    if (typeof doc.updatedAt === 'string') {
      lastModified = doc.updatedAt;
    } else if (doc.updatedAt instanceof Date) {
      lastModified = doc.updatedAt.toISOString();
    } else {
      lastModified = new Date(doc.updatedAt).toISOString();
    }
  } else {
    lastModified = new Date().toISOString();
  }
  
  return {
    id: doc.id,
    name: doc.name,
    description: doc.description,
    parameters: doc.parameters,
    isActive: doc.isActive,
    lastModified,
    linkedSopId: doc.linkedSopId
  };
}

// Helper function to convert SOPDocument to SOP
function convertSOPDocumentToSOP(doc: SOPDocument): SOP {
  let lastModified: string;
  if (doc.updatedAt) {
    if (typeof doc.updatedAt === 'string') {
      lastModified = doc.updatedAt;
    } else if (doc.updatedAt instanceof Date) {
      lastModified = doc.updatedAt.toISOString();
    } else {
      lastModified = new Date(doc.updatedAt).toISOString();
    }
  } else {
    lastModified = new Date().toISOString();
  }
  
  return {
    ...doc,
    lastModified
  };
}

const subParameterSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Sub-parameter name cannot be empty.").max(150, "Sub-parameter name is too long."),
  weight: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? 0 : Number(val)),
    z.number().min(0, "Weight must be non-negative.").max(100, "Weight cannot exceed 100.")
  ),
  type: z.enum(['Non-Fatal', 'Fatal', 'ZTP'], { required_error: "Type is required." }),
});

const parameterSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Parameter group name cannot be empty.").max(100, "Group name is too long."),
  subParameters: z.array(subParameterSchema).min(1, "Each group must have at least one sub-parameter."),
});

const campaignSchema = z.object({
  name: z.string().min(3, "Campaign Name must be at least 3 characters").max(100, "Campaign Name must be 100 characters or less"),
  description: z.string().min(5, "Description must be at least 5 characters").max(250, "Description must be 250 characters or less"),
  parameters: z.array(parameterSchema).min(1, "A campaign must have at least one parameter group."),
  isActive: z.boolean().default(true),
  linkedSopId: z.string().optional(),
}).refine(
  (data) => {
    const totalWeight = data.parameters
      .flatMap(p => p.subParameters)
      .reduce((sum, sp) => sum + sp.weight, 0);
    return Math.abs(totalWeight - 100) < 0.01;
  },
  {
    message: "The sum of all sub-parameter weights across all groups must be exactly 100.",
    path: ["parameters"],
  }
);


type CampaignFormValues = z.infer<typeof campaignSchema>;

// Removed localStorage constants - now using database operations

const TotalWeightDisplay = ({ control }: { control: any }) => {
  const parameters = useWatch({
    control,
    name: "parameters",
  });

  const totalWeight = parameters
    .flatMap((p: Parameter) => p.subParameters || [])
    .reduce((sum: number, sp: SubParameter) => sum + (sp.weight || 0), 0);

  return (
    <div className={cn(
        "text-sm font-semibold p-2 rounded-md",
        Math.abs(totalWeight - 100) < 0.01 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
    )}>
        Total Weight: {totalWeight.toFixed(2)} / 100
    </div>
  );
};


export default function ParameterManagementPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<QAParameter[]>([]);
  const [availableSops, setAvailableSops] = useState<SOP[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [campaignToDelete, setCampaignToDelete] = useState<QAParameter | null>(null);
 const [isFormOpen, setIsFormOpen] = useState(false);
 const [editingCampaign, setEditingCampaign] = useState<QAParameter | null>(null);

 const form = useForm<CampaignFormValues>({
 resolver: zodResolver(campaignSchema),
 defaultValues: {
 name: '',
 description: '',
 parameters: [],
 isActive: true,
 linkedSopId: undefined,
 },
 });

 const { fields: parameterFields, append: appendParameter, remove: removeParameter } = useFieldArray({
 control: form.control,
 name: "parameters",
 });

 const handleAddNewParameterGroup = () => {
 appendParameter({
 id: `group_${Date.now()}`,
 name: `New Parameter Group ${parameterFields.length + 1}`,
 subParameters: [{ id: `sub_${Date.now()}`, name: 'New Sub-Parameter', weight: 0, type: 'Non-Fatal' }],
 });
 };

 useEffect(() => {
    const loadData = async () => {
      try {
        const [parametersResponse, sopsResponse] = await Promise.all([
          fetch('/api/qa-parameters', { headers: getAuthHeaders() }),
          fetch('/api/sops', { headers: getAuthHeaders() })
        ]);
        
        if (!parametersResponse.ok || !sopsResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const parametersData = await parametersResponse.json();
        const sopsData = await sopsResponse.json();
        
        // Handle API response format { success: true, data: [...] }
        const parameters = parametersData.success ? parametersData.data : parametersData;
        const sops = sopsData.success ? sopsData.data : sopsData;
        
        setCampaigns(parameters.map(convertQAParameterDocumentToQAParameter));
        setAvailableSops(sops.map(convertSOPDocumentToSOP));
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load QA parameters and SOPs from database.',
          variant: 'destructive'
        });
      }
    };

    loadData();
  }, [toast]);

 const openFormForNew = () => {
 setEditingCampaign(null);
 form.reset({
 name: '',
 description: '',
 parameters: [
 { id: `group_${Date.now()}`, name: 'Customer Greeting', subParameters: [
 { id: `sub_${Date.now()}_1`, name: 'Used standard greeting', weight: 50, type: 'Non-Fatal' },
 { id: `sub_${Date.now()}_2`, name: 'Was professional', weight: 50, type: 'Non-Fatal' },
        ]}
 ],
 isActive: true,
 linkedSopId: undefined,
 });
 setIsFormOpen(true);
  };

 const openFormForEdit = (campaign: QAParameter) => {
 setEditingCampaign(campaign);
 form.reset({
 name: campaign.name,
 description: campaign.description,
 parameters: campaign.parameters.length > 0 ? campaign.parameters.map(p => ({
 ...p,
 subParameters: p.subParameters.map(sp => ({...sp}))
 })) : [],
 isActive: campaign.isActive,
 linkedSopId: campaign.linkedSopId || undefined,
 });
 setIsFormOpen(true);
  };

 const closeForm = () => {
 setIsFormOpen(false);
 setEditingCampaign(null);
 form.reset();
  };

 const onSubmit = async (data: CampaignFormValues) => {
    const submissionData = {
      ...data,
      linkedSopId: data.linkedSopId === "none" ? undefined : data.linkedSopId,
    };

    try {
      if (editingCampaign) {
        const response = await fetch(`/api/qa-parameters/${editingCampaign.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(submissionData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to update campaign');
        }
        
        const updatedCampaign = await response.json();
        const updatedCampaignData = updatedCampaign.success ? updatedCampaign.data : updatedCampaign;
        setCampaigns(campaigns.map((c) =>
          c.id === editingCampaign.id ? convertQAParameterDocumentToQAParameter(updatedCampaignData) : c
        ));
        toast({ title: 'Campaign Updated', description: `Campaign "${submissionData.name}" has been updated.` });
      } else {
        const userResponse = await fetch('/api/user/profile', {
          headers: getAuthHeaders()
        });
        if (!userResponse.ok) {
          throw new Error('Failed to get user details');
        }
        const currentUser = await userResponse.json();
        
        const response = await fetch('/api/qa-parameters', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ...submissionData,
            createdBy: currentUser?.id || 'unknown'
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to create campaign');
        }
        
        const newCampaign = await response.json();
        const newCampaignData = newCampaign.success ? newCampaign.data : newCampaign;
        setCampaigns([convertQAParameterDocumentToQAParameter(newCampaignData), ...campaigns]);
        toast({ title: 'Campaign Created', description: `Campaign "${submissionData.name}" has been created.` });
      }
      closeForm();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to save campaign. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/qa-parameters/${campaignId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete campaign');
      }
      
      setCampaigns(campaigns.filter((c) => c.id !== campaignId));
      toast({ title: 'Campaign Deleted', description: 'The Campaign has been deleted.', variant: 'destructive' });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete campaign. Please try again.',
        variant: 'destructive'
      });
    }
    setCampaignToDelete(null);
  };

  const filteredCampaigns = campaigns.filter(c =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.parameters || []).some(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.subParameters || []).some(sp => (sp.name || '').toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="space-y-6">
      <Suspense fallback={<div>Loading...</div>}>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div className="mb-4 sm:mb-0">
                <CardTitle className="text-3xl font-bold flex items-center">
                  <ListChecks className="mr-3 h-8 w-8 text-primary" /> QA Audit Parameter Campaigns
                </CardTitle>
                <CardDescription>
                  Manage hierarchical QA campaigns. Create parameter groups, add weighted sub-parameters, and mark items as Fatal or ZTP.
                </CardDescription>
              </div>
              <Button onClick={openFormForNew} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Campaign
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Label htmlFor="search-params" className="sr-only">Search Campaigns</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search-params"
                  type="search"
                  placeholder="Search by campaign, group, or sub-parameter names..."
                  value={searchTerm}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            {isFormOpen && (
              <Card className="mb-6 shadow-md border-primary/50">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                      <CardTitle className="text-xl">{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</CardTitle>
                      <CardDescription>{editingCampaign ? `Update the details for campaign "${editingCampaign.name}".` : 'Fill in the details for the new campaign.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Campaign Details */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Campaign Name</FormLabel><FormControl><Input placeholder="e.g., Standard Product Audit" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="Campaign description" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                      </div>

                      {/* Parameter Groups */}
                      <div className="space-y-4">
                        <FormLabel>Parameter Groups</FormLabel>
                        {parameterFields.map((groupField, groupIndex) => (
                          <Collapsible key={groupField.id} defaultOpen className="p-4 border rounded-lg space-y-4 bg-card/50">
                            <div className="flex items-center justify-between">
                              <CollapsibleTrigger asChild>
                                <div className="flex items-center gap-2 cursor-pointer">
                                  <FormField control={form.control} name={`parameters.${groupIndex}.name`} render={({ field }) => (
                                      <FormItem className="flex-grow"><FormLabel className="sr-only">Group Name</FormLabel><FormControl><Input className="text-lg font-semibold border-0 shadow-none focus-visible:ring-1" {...field} /></FormControl><FormMessage /></FormItem>
                                  )}/>
                                  <ChevronDown className="h-5 w-5 transition-transform duration-200" />
                                </div>
                              </CollapsibleTrigger>
                              <Button type="button" variant="destructive" size="sm" onClick={() => removeParameter(groupIndex)}>Remove Group</Button>
                            </div>
                            <CollapsibleContent className="space-y-3 pt-2">
                               <SubParameterFields groupIndex={groupIndex} control={form.control} />
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={handleAddNewParameterGroup}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Parameter Group
                        </Button>
                      </div>

                       {form.formState.errors.parameters?.message && <FormMessage>{form.formState.errors.parameters.message}</FormMessage>}
                       {form.formState.errors.parameters?.root?.message && <FormMessage>{form.formState.errors.parameters.root.message}</FormMessage>}


                      {/* Other Settings */}
                      <div className="grid md:grid-cols-2 gap-4 items-end pt-4 border-t">
                        <FormField control={form.control} name="linkedSopId" render={({ field }) => (
                            <FormItem><FormLabel className="flex items-center"><BookOpen className="mr-2 h-4 w-4 text-muted-foreground" /> Link to SOP (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || "none"}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select an SOP to link" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectItem value="none">No specific SOP linked</SelectItem>
                                  {availableSops.filter(sop => sop.status === 'Published').map(sop => (
                                    <SelectItem key={sop.id} value={sop.id}>{sop.title} (v{sop.version})</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="isActive" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-card/30 h-full">
                              <div className="space-y-0.5"><FormLabel>Active Status</FormLabel></div>
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )}/>
                      </div>

                    </CardContent>
                    <CardFooter className="flex justify-between items-center pt-4">
                       <TotalWeightDisplay control={form.control} />
                      <div className="flex space-x-3">
                          <Button type="button" variant="outline" onClick={closeForm}>
                            <XCircle className="mr-2 h-4 w-4" /> Cancel
                          </Button>
                          <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Save className="mr-2 h-4 w-4" /> {editingCampaign ? 'Save Changes' : 'Create Campaign'}
                          </Button>
                      </div>
                    </CardFooter>
                  </form>
                </Form>
              </Card>
            )}

            {filteredCampaigns.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign Name</TableHead>
                      <TableHead>Groups</TableHead>
                      <TableHead>Sub-parameters</TableHead>
                      <TableHead>Linked SOP</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Modified</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.map((c) => {
                      const linkedSop = availableSops.find(s => s.id === c.linkedSopId);
                      return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{(c.parameters || []).length}</TableCell>
                        <TableCell>{(c.parameters || []).flatMap(p => p.subParameters || []).length}</TableCell>
                        <TableCell>{linkedSop ? `${linkedSop.title} (v${linkedSop.version})` : 'N/A'}</TableCell>
                        <TableCell><span className={`px-2 py-1 text-xs rounded-full ${c.isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></TableCell>
                        <TableCell>{format(new Date(c.lastModified), 'PPp')}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => openFormForEdit(c)}><Edit className="h-4 w-4" /></Button>
                           <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="destructive" size="sm" onClick={() => setCampaignToDelete(c)}><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                            {campaignToDelete && campaignToDelete.id === c.id && (
                               <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the Campaign titled <strong className="px-1">{campaignToDelete.name}</strong>.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel onClick={() => setCampaignToDelete(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCampaign(campaignToDelete.id)}>Yes, delete campaign</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            )}
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
                              </div>
            )}

             {filteredCampaigns.length === 0 && !isFormOpen && (
              <p className="text-center text-muted-foreground py-8">
                 {searchTerm ? 'No campaigns match your search.' : 'No campaigns defined yet. Click "Add New Campaign" to get started.'}
              </p>
            )}

          </CardContent>
        </Card>
      </Suspense>
    </div>
  );
}


function SubParameterFields({ groupIndex, control }: { groupIndex: number, control: any }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `parameters.${groupIndex}.subParameters`,
  });

  const handleAddSubParameter = () => {
    append({
        id: `sub_${Date.now()}`,
        name: `New Sub-Parameter ${fields.length + 1}`,
        weight: 0,
        type: 'Non-Fatal'
    });
  };

  return (
    <div className="space-y-3 pl-4 border-l-2 border-primary/20">
      <div className="grid grid-cols-[1fr,100px,140px,auto] gap-2 items-center text-sm font-medium text-muted-foreground">
        <Label>Sub-Parameter Name</Label>
        <Label>Weight</Label>
        <Label>Type</Label>
        <div/>
      </div>
      {fields.map((subField, subIndex) => (
        <div key={subField.id} className="grid grid-cols-[1fr,100px,140px,auto] gap-2 items-start">
          <FormField control={control} name={`parameters.${groupIndex}.subParameters.${subIndex}.name`} render={({ field }) => (
              <FormItem><FormLabel className="sr-only">Name</FormLabel><FormControl><Input placeholder="Sub-parameter name" {...field} /></FormControl><FormMessage /></FormItem>
          )}/>
          <FormField control={control} name={`parameters.${groupIndex}.subParameters.${subIndex}.weight`} render={({ field }) => (
              <FormItem><FormLabel className="sr-only">Weight</FormLabel><FormControl><Input type="number" placeholder="0" {...field} onChange={e => field.onChange(Number(e.target.value))}/></FormControl><FormMessage /></FormItem>
          )}/>
          <FormField control={control} name={`parameters.${groupIndex}.subParameters.${subIndex}.type`} render={({ field }) => (
              <FormItem><FormLabel className="sr-only">Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Non-Fatal">Non-Fatal</SelectItem>
                    <SelectItem value="Fatal">Fatal</SelectItem>
                    <SelectItem value="ZTP">ZTP</SelectItem>
                  </SelectContent>
                </Select><FormMessage /></FormItem>
          )}/>
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => remove(subIndex)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={handleAddSubParameter} className="mt-2">
        <PlusCircle className="mr-2 h-4 w-4" /> Add Sub-Parameter
      </Button>
    </div>
  );
}
