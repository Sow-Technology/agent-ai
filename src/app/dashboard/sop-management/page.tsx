
'use client';

import dynamic from 'next/dynamic';

import { useState, useEffect, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PlusCircle, Edit, Trash2, BookOpen, Search, Save, XCircle, RotateCcw, ListChecks, Brain, Loader2 } from 'lucide-react';
import type { SOP } from '@/types/sop';
import type { QAParameter } from '@/types/qa-parameter';
import { generateParametersFromSop } from '@/ai/flows/generate-parameters-from-sop-flow';
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
import { Label } from '@/components/ui/label';

const sopSchema = z.object({

  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be 100 characters or less"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  category: z.string().min(1, "Category is required").max(200, "Category must be 200 characters or less"),
  version: z.string().min(1, "Version is required").max(10, "Version must be 10 characters or less"),
  status: z.enum(['Draft', 'Published', 'Archived'], { required_error: "Status is required" }),
  linkedParameterSetId: z.string().optional(),
});

type SopFormValues = z.infer<typeof sopSchema>;

const LOCAL_STORAGE_KEY_SOPS = 'assureQaiSops';
const LOCAL_STORAGE_KEY_PARAMETERS = 'assureQaiQaParameterSets';

const defaultFormValues: SopFormValues = {
  title: '',
  content: '',
  category: '',
  version: '1.0',
  status: 'Draft',
  linkedParameterSetId: undefined,
};

import { Suspense } from 'react';
export default function SopManagementPage() {

  const { toast } = useToast();
  const [sops, setSops] = useState<SOP[]>([]);
  const [availableParameterSets, setAvailableParameterSets] = useState<QAParameter[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSop, setEditingSop] = useState<SOP | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sopToDelete, setSopToDelete] = useState<SOP | null>(null);
  const [generatingCampaignId, setGeneratingCampaignId] = useState<string | null>(null);


  const form = useForm<SopFormValues>({
    resolver: zodResolver(sopSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSops = localStorage.getItem(LOCAL_STORAGE_KEY_SOPS);
      if (storedSops) {
        setSops(JSON.parse(storedSops));
      }
      const storedParameters = localStorage.getItem(LOCAL_STORAGE_KEY_PARAMETERS);
      if (storedParameters) {
        setAvailableParameterSets(JSON.parse(storedParameters) as QAParameter[]);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY_SOPS, JSON.stringify(sops));
    }
  }, [sops]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY_PARAMETERS, JSON.stringify(availableParameterSets));
    }
  }, [availableParameterSets]);


  const getFormResetValues = (): SopFormValues => {
    if (editingSop) {
      return {
        title: editingSop.title,
        content: editingSop.content,
        category: editingSop.category,
        version: editingSop.version,
        status: editingSop.status,
        linkedParameterSetId: editingSop.linkedParameterSetId || undefined,
      };
    }
    return defaultFormValues;
  };

  const openFormForNew = () => {
    setEditingSop(null);
    form.reset(defaultFormValues);
    setIsFormOpen(true);
  };

  const openFormForEdit = (sop: SOP) => {
    setEditingSop(sop);
    form.reset({
      title: sop.title,
      content: sop.content,
      category: sop.category,
      version: sop.version,
      status: sop.status,
      linkedParameterSetId: sop.linkedParameterSetId || undefined,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingSop(null);
    form.reset(defaultFormValues);
  };

  const onSubmit = (data: SopFormValues) => {
    const submissionData = {
      ...data,
      linkedParameterSetId: data.linkedParameterSetId === "none" ? undefined : data.linkedParameterSetId,
    };

    if (editingSop) {
      const updatedSops = sops.map((sop) =>
        sop.id === editingSop.id ? { ...editingSop, ...submissionData, lastModified: new Date().toISOString() } : sop
      );
      setSops(updatedSops);
      toast({ title: 'SOP Updated', description: `SOP "${submissionData.title}" has been updated.` });
    } else {
      const newSop: SOP = {
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        ...submissionData,
        lastModified: new Date().toISOString(),
      };
      setSops([newSop, ...sops]);
      toast({ title: 'SOP Created', description: `SOP "${submissionData.title}" has been created.` });
    }
    closeForm();
  };

  const handleDeleteSop = (sopId: string) => {
    setSops(sops.filter((sop) => sop.id !== sopId));
    toast({ title: 'SOP Deleted', description: 'The SOP has been deleted.', variant: 'destructive' });
    setSopToDelete(null);
  };

  const handleGenerateCampaign = async (sopToProcess: SOP) => {
    setGeneratingCampaignId(sopToProcess.id);
    try {
      const result = await generateParametersFromSop({
        title: sopToProcess.title,
        content: sopToProcess.content,
      });

      const newCampaign: QAParameter = {
        id: `campaign_${Date.now()}`,
        name: result.name,
        description: result.description,
        parameters: [
          {
            id: `param_${Date.now()}`,
            name: "AI Generated Parameters",
            subParameters: result.items.map((item, index) => ({
                id: `sub_${Date.now()}_${index}`,
                name: item.name,
                weight: item.weight,
                type: 'Non-Fatal',
            })),
          }
        ],
        isActive: true,
        lastModified: new Date().toISOString(),
        linkedSopId: sopToProcess.id, // Link back to the SOP
      };

      setAvailableParameterSets(prev => [...prev, newCampaign]);

      // Update the SOP to be linked to the new campaign
      setSops(prevSops => prevSops.map(s => 
        s.id === sopToProcess.id ? { ...s, linkedParameterSetId: newCampaign.id } : s
      ));
      
      toast({
        title: "AI Campaign Generated!",
        description: `New QA campaign "${result.name}" has been created and linked to this SOP.`,
      });

    } catch (error) {
      console.error("Failed to generate campaign with AI", error);
      toast({
        title: "AI Generation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setGeneratingCampaignId(null);
    }
  };


  const filteredSops = sops.filter(sop => 
    sop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sop.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sop.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Suspense fallback={<div>Loading SOP Management...</div>}>
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-4 sm:mb-0">
              <CardTitle className="text-3xl font-bold flex items-center">
                <BookOpen className="mr-3 h-8 w-8 text-primary" /> Standard Operating Procedures (SOPs)
              </CardTitle>
              <CardDescription>Manage all company SOPs here. Create, edit, and publish procedures. Use the ✨ button to auto-generate a linked QA campaign.</CardDescription>
            </div>
            <Button onClick={openFormForNew} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New SOP
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label htmlFor="search-sops" className="sr-only">Search SOPs</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search-sops"
                type="search"
                placeholder="Search by title, category, or status..."
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
                    <CardTitle className="text-xl">{editingSop ? 'Edit SOP' : 'Create New SOP'}</CardTitle>
                    <CardDescription>{editingSop ? `Update the details for "${editingSop.title}".` : 'Fill in the details for the new SOP.'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="SOP Title (e.g., Customer Onboarding Process)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Detailed steps and procedures..." {...field} rows={6} />
                          </FormControl>
                          <FormDescription>
                            The AI will use this content to generate a QA campaign if you use the AI generation feature.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid md:grid-cols-2 gap-4">
                       <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Operations, HR, Sales, IT Support, Finance, Marketing, Customer Service, Product Development, Logistics, Quality Assurance, Training, Onboarding, Offboarding, Grievance Redressal, Security Protocols, Data Management, Client Relations, Vendor Management, Project Management, Legal Compliance" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="version"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Version</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 1.0, 1.1, 2.0b" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Draft">Draft</SelectItem>
                                <SelectItem value="Published">Published</SelectItem>
                                <SelectItem value="Archived">Archived</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="linkedParameterSetId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center"><ListChecks className="mr-2 h-4 w-4 text-muted-foreground" /> Link to QA Parameter Campaign (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "none"}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a campaign to link" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No specific campaign linked</SelectItem>
                                {availableParameterSets.filter(ps => ps.isActive).map(ps => (
                                  <SelectItem key={ps.id} value={ps.id}>{ps.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="outline" onClick={closeForm}>
                      <XCircle className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Save className="mr-2 h-4 w-4" /> {editingSop ? 'Save Changes' : 'Create SOP'}
                    </Button>
                     {editingSop && (
                       <Button type="button" variant="ghost" onClick={() => form.reset(getFormResetValues())} className="text-muted-foreground">
                         <RotateCcw className="mr-2 h-4 w-4" /> Reset Form
                       </Button>
                     )}
                  </CardFooter>
                </form>
              </Form>
            </Card>
          )}

          {filteredSops.length === 0 && !isFormOpen && (
            <p className="text-center text-muted-foreground py-8">
              {searchTerm ? 'No SOPs match your search.' : 'No SOPs created yet. Click "Add New SOP" to get started.'}
            </p>
          )}

          {filteredSops.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Linked Campaign</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSops.map((sop) => {
                    const isGenerating = generatingCampaignId === sop.id;
                    const linkedCampaign = availableParameterSets.find(ps => ps.id === sop.linkedParameterSetId);
                    return (
                    <TableRow key={sop.id}>
                      <TableCell className="font-medium">{sop.title}</TableCell>
                      <TableCell>{sop.category}</TableCell>
                      <TableCell>{sop.version}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          sop.status === 'Published' ? 'bg-green-500 text-white' :
                          sop.status === 'Draft' ? 'bg-yellow-500 text-black' :
                          'bg-gray-500 text-white'
                        }`}>
                          {sop.status}
                        </span>
                      </TableCell>
                      <TableCell>{linkedCampaign ? linkedCampaign.name : 'N/A'}</TableCell>
                      <TableCell>{format(new Date(sop.lastModified), 'PPp')}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleGenerateCampaign(sop)}
                          disabled={!!sop.linkedParameterSetId || isGenerating}
                          title={sop.linkedParameterSetId ? "SOP is already linked to a campaign" : "Generate QA Campaign with AI"}
                        >
                          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin"/> : <Brain className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openFormForEdit(sop)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" onClick={() => setSopToDelete(sop)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          {sopToDelete && sopToDelete.id === sop.id && (
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the SOP titled 
                                    <strong className="px-1">{sopToDelete.title}</strong>.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setSopToDelete(null)}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteSop(sopToDelete.id)}>
                                    Yes, delete SOP
                                  </AlertDialogAction>
                                </AlertDialogFooter>
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
        </CardContent>
      </Card>
    </div>
    </Suspense>
  );
}
