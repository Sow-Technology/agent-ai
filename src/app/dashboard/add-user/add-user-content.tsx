"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
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
import { PlusCircle, Edit, Trash2, Users } from "lucide-react";
import type { User } from "@/types/auth";
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

import { getAuthHeaders } from "@/lib/authUtils";

const userSchema = z.object({
  fullName: z
    .string()
    .min(3, "Full name must be at least 3 characters.")
    .max(50, "Full name is too long."),
  email: z.string().email("Invalid email address."),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username is too long."),
  role: z.enum(
    [
      "Administrator",
      "Project Admin",
      "Manager",
      "QA Analyst",
      "Auditor",
      "Agent",
    ],
    { required_error: "Role is required" }
  ),
  projectId: z.string().optional(),
  password: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UserManagementContent() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      fullName: "",
      email: "",
      username: "",
      role: "Agent",
      projectId: "",
      password: "",
    },
  });

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch("/api/users/managed", {
          headers: getAuthHeaders(),
        });
        const data = await response.json();

        if (response.ok && data.success) {
          setUsers(data.data);
        } else {
          throw new Error(data.error || "Failed to load users");
        }
      } catch (error) {
        console.error("Error loading users:", error);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        });
      }
    };
    loadUsers();
  }, [toast]);

  const openFormForNew = () => {
    setEditingUser(null);
    form.reset({
      fullName: "",
      email: "",
      username: "",
      role: "Agent",
      projectId: "",
      password: "",
    });
    setIsFormOpen(true);
  };

  const openFormForEdit = (user: User) => {
    setEditingUser(user);
    form.reset({
      fullName: user.fullName || "",
      email: user.email || "",
      username: user.username || "",
      role: user.role,
      projectId: user.projectId || "",
      password: "",
    }); // Don't show password on edit
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
    form.reset();
  };

  const onSubmit = async (data: UserFormValues) => {
    try {
      if (editingUser) {
        const updatedData: any = { ...editingUser, ...data };
        if (!data.password) {
          // If password is not changed, don't update it
          delete updatedData.password;
        }
        const response = await fetch("/api/users/managed", {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(updatedData),
        });
        const result = await response.json();

        if (response.ok && result.success) {
          setUsers(
            users.map((u) => (u.id === result.data.id ? result.data : u))
          );
          toast({
            title: "User Updated",
            description: `User "${data.fullName}" has been updated.`,
          });
        } else {
          toast({
            title: "Update Failed",
            description: result.error || "Could not update user.",
            variant: "destructive",
          });
        }
      } else {
        if (!data.password || data.password.length < 6) {
          form.setError("password", {
            type: "manual",
            message: "Password must be at least 6 characters long.",
          });
          return;
        }
        const response = await fetch("/api/users/managed", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        });
        const result = await response.json();

        if (response.ok && result.success) {
          setUsers([result.data, ...users]);
          toast({
            title: "User Created",
            description: `User "${data.fullName}" has been created.`,
          });
        } else {
          toast({
            title: "Creation Failed",
            description:
              result.error ||
              `A user with username "${data.username}" may already exist.`,
            variant: "destructive",
          });
        }
      }
      closeForm();
    } catch (error) {
      console.error("Error submitting user form:", error);
      toast({
        title: "Error",
        description: "An error occurred while saving the user.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/managed?id=${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setUsers(users.filter((u) => u.id !== userId));
        toast({
          title: "User Deleted",
          description: "The user has been successfully deleted.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Deletion Failed",
          description: result.error || "Could not delete user.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the user.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-4 sm:mb-0">
              <CardTitle className="text-3xl font-bold flex items-center">
                <Users className="mr-3 h-8 w-8 text-primary" /> User Management
              </CardTitle>
              <CardDescription>
                Add, edit, or remove users from the system.
              </CardDescription>
            </div>
            {!isFormOpen && (
              <Button
                onClick={openFormForNew}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <PlusCircle className="mr-2 h-5 w-5" /> Add New User
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isFormOpen && (
            <Card className="mb-6 shadow-md border-primary/50">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <CardHeader>
                    <CardTitle className="text-xl">
                      {editingUser ? "Edit User" : "Create New User"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="johndoe"
                                {...field}
                                disabled={!!editingUser}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="user@example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Agent">Agent</SelectItem>
                                <SelectItem value="Auditor">Auditor</SelectItem>
                                <SelectItem value="QA Analyst">
                                  QA Analyst
                                </SelectItem>
                                <SelectItem value="Manager">Manager</SelectItem>
                                <SelectItem value="Project Admin">
                                  Project Admin
                                </SelectItem>
                                <SelectItem value="Administrator">
                                  Administrator
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="projectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project ID (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Leave blank if not assigning to a project"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder={
                                  editingUser
                                    ? "Leave blank to keep current password"
                                    : "Enter password (min. 6 chars)"
                                }
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="outline" onClick={closeForm}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingUser ? "Save Changes" : "Create User"}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.fullName}
                    </TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openFormForEdit(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the user{" "}
                              <strong className="px-1">{user.fullName}</strong>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {users.length === 0 && !isFormOpen && (
            <p className="text-center text-muted-foreground py-8">
              No users created yet. Click &ldquo;Add New User&rdquo; to get
              started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
