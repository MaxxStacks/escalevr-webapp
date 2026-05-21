import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowRightLeft, Bell, BellDot, Loader2, MessageSquare, Plus, Send, UserPlus, X, Paperclip } from "lucide-react";
import Layout from "@/components/layout/layout";

// Type definitions for chat data
interface ChatRoom {
  id: number;
  name: string;
  type: "internal" | "client";
  createdAt: string;
  createdBy: number;
  clientId: number | null;
  isActive: boolean;
  assignedToId?: number | null;
}

interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  message: string;
  sentAt: string;
  isRead: boolean;
}

interface ChatParticipant {
  id: number;
  roomId: number;
  userId: number;
  joinedAt: string;
  isActive: boolean;
}

interface User {
  id: number;
  fullName: string;
  username: string;
  role: string;
  avatarUrl?: string;
}

// New chat room schema
const newChatRoomSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  type: z.enum(["internal", "client"]),
  clientId: z.number().optional().nullable(),
  participants: z.array(z.number()).optional(),
});

type NewChatRoomValues = z.infer<typeof newChatRoomSchema>;

// New message schema
const newMessageSchema = z.object({
  message: z.string().min(1, "Le message ne peut pas être vide"),
});

type NewMessageValues = z.infer<typeof newMessageSchema>;

export default function ChatPage() {
  const [location, setLocation] = useLocation();
  const { roomId } = useParams<{ roomId?: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newMessageDialogOpen, setNewMessageDialogOpen] = useState(false);
  const [addParticipantDialogOpen, setAddParticipantDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<"internal" | "client">("internal");
  
  // Si l'utilisateur est un client, on active automatiquement l'onglet client
  useEffect(() => {
    if (user?.role === "client") {
      setActiveTab("client");
    }
  }, [user]);

  // Query to get all chat rooms
  const {
    data: chatRooms = [],
    isLoading: loadingRooms,
  } = useQuery<ChatRoom[]>({
    queryKey: ["/api/chat/rooms"],
    queryFn: ({ signal }) => 
      apiRequest("GET", "/api/chat/rooms", undefined)
        .then(res => res.json()),
  });

  // Query to get specific room data when roomId is provided
  const {
    data: roomData,
    isLoading: loadingRoom,
  } = useQuery({
    queryKey: ["/api/chat/rooms", roomId],
    queryFn: () => 
      apiRequest("GET", `/api/chat/rooms/${roomId}`, undefined)
        .then(res => res.json()),
    enabled: !!roomId,
  });

  // Query to get all users for creating chats
  const { 
    data: allUsers = [],
    isLoading: loadingUsers 
  } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: () => 
      apiRequest("GET", "/api/users", undefined)
        .then(res => res.json()),
  });

  // Filter rooms by type
  const internalRooms = chatRooms.filter(room => room.type === "internal");
  const clientRooms = chatRooms.filter(room => room.type === "client");

  // Get staff users (for internal chat creation)
  const staffUsers = allUsers.filter(u => u.role !== "client");
  
  // Get client users (for client chat creation)
  const clientUsers = allUsers.filter(u => u.role === "client");

  // Create a new chat room
  const createRoomMutation = useMutation({
    mutationFn: async (data: NewChatRoomValues) => {
      const res = await apiRequest("POST", "/api/chat/rooms", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      setNewMessageDialogOpen(false);
      toast({
        title: "Conversation créée",
        description: "La nouvelle conversation a été créée avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `Échec de la création: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Send a new message
  const sendMessageMutation = useMutation({
    mutationFn: async (data: NewMessageValues) => {
      const res = await apiRequest("POST", `/api/chat/rooms/${roomId}/messages`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms", roomId] });
      messageForm.reset({ message: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `Échec de l'envoi: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Add a participant to chat
  const addParticipantMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/chat/rooms/${roomId}/participants`, { userId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms", roomId] });
      setAddParticipantDialogOpen(false);
      toast({
        title: "Participant ajouté",
        description: "Le participant a été ajouté avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `Échec de l'ajout: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Transfer conversation to another service agent
  const transferConversationMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("PATCH", `/api/chat/rooms/${roomId}/transfer`, { assignedToId: userId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms", roomId] });
      setTransferDialogOpen(false);
      
      // Envoi d'un message de notification dans la conversation
      sendMessageMutation.mutate({ 
        message: "Cette conversation vous a été transférée par un agent de service."
      });
      
      toast({
        title: "Conversation transférée",
        description: "La conversation a été transférée avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur lors du transfert",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Remove a participant from chat
  const removeParticipantMutation = useMutation({
    mutationFn: async (participantId: number) => {
      const res = await apiRequest("DELETE", `/api/chat/rooms/${roomId}/participants/${participantId}`);
      return res.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms", roomId] });
      toast({
        title: "Participant retiré",
        description: "Le participant a été retiré avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `Échec du retrait: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Set up form for new messages
  const messageForm = useForm<NewMessageValues>({
    resolver: zodResolver(newMessageSchema),
    defaultValues: {
      message: "",
    },
  });

  // Set up form for new chat rooms
  const roomForm = useForm<NewChatRoomValues>({
    resolver: zodResolver(newChatRoomSchema),
    defaultValues: {
      name: "",
      type: "internal",
      clientId: null,
      participants: [],
    },
  });

  // Submit new message
  const onMessageSubmit = (values: NewMessageValues) => {
    sendMessageMutation.mutate(values);
  };

  // Submit new chat room
  const onRoomSubmit = (values: NewChatRoomValues) => {
    createRoomMutation.mutate(values);
  };

  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [roomData?.messages]);

  // Reset chat room form when dialog opens
  useEffect(() => {
    if (newMessageDialogOpen) {
      roomForm.reset({
        name: "",
        type: activeTab,
        clientId: null,
        participants: [],
      });
    }
  }, [newMessageDialogOpen, activeTab, roomForm]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "PPp", { locale: fr });
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  // Find user by ID
  const findUser = (userId: number): User | undefined => {
    return allUsers.find(u => u.id === userId);
  };

  // Check if user is already a participant
  const isUserAlreadyParticipant = (userId: number): boolean => {
    return roomData?.participants.some((p: any) => p.userId === userId) || false;
  };

  // Get current room
  const currentRoom = chatRooms.find(room => room.id === Number(roomId));

  // Upload a file attachment and send as message
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/chat/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Échec du téléversement");
      return res.json() as Promise<{ url: string; name: string }>;
    },
    onSuccess: (data) => {
      sendMessageMutation.mutate({ message: `[Fichier: ${data.name}](${data.url})` });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de téléverser le fichier.", variant: "destructive" });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFileMutation.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Layout>
    <div className="h-full">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Conversations et notifications</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue={activeTab} onValueChange={(v) => setActiveTab(v as "internal" | "client")}>
                <TabsList className="w-full">
                  {user?.role !== "client" && <TabsTrigger value="internal" className="flex-1">Interne</TabsTrigger>}
                  <TabsTrigger value="client" className="flex-1">Client</TabsTrigger>
                </TabsList>
                <TabsContent value="internal">
                  <ScrollArea className="h-[500px]">
                    {loadingRooms ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : internalRooms.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Aucune conversation interne
                      </div>
                    ) : (
                      <div className="space-y-1 p-2">
                        {internalRooms.map(room => (
                          <Button
                            key={room.id}
                            variant={room.id === Number(roomId) ? "default" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => setLocation(`/chat/${room.id}`)}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <span className="truncate">{room.name}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="client">
                  <ScrollArea className="h-[500px]">
                    {loadingRooms ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : clientRooms.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Aucune conversation avec clients
                      </div>
                    ) : (
                      <div className="space-y-1 p-2">
                        {clientRooms.map(room => (
                          <Button
                            key={room.id}
                            variant={room.id === Number(roomId) ? "default" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => setLocation(`/chat/${room.id}`)}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <span className="truncate">{room.name}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-center p-4">
              {user?.role !== "client" && (
                <Button 
                  onClick={() => setNewMessageDialogOpen(true)}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle conversation
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        <div className="md:col-span-3">
          {!roomId ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center p-10">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Sélectionnez une conversation</p>
                <p className="text-muted-foreground">
                  Choisissez une conversation dans la liste ou créez-en une nouvelle
                </p>
              </CardContent>
            </Card>
          ) : loadingRoom ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent>
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
              </CardContent>
            </Card>
          ) : !roomData ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center p-10">
                <p className="text-lg font-medium">Conversation non trouvée</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>{roomData.room.name}</CardTitle>
                  <CardDescription>
                    {roomData.room.type === "internal" ? "Conversation interne" : "Conversation avec client"}
                  </CardDescription>
                </div>
                {roomData.room.type === "internal" && user?.role !== "client" && (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddParticipantDialogOpen(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Ajouter participant
                    </Button>
                    {["admin", "service"].includes(user?.role as string) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTransferDialogOpen(true)}
                      >
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        Transférer
                      </Button>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-grow overflow-hidden p-0">
                <div className="p-4 border-b">
                  <h4 className="mb-2 font-medium">Participants:</h4>
                  <div className="flex flex-wrap gap-2">
                    {roomData.participants.map((participant: any) => {
                      const participantUser = findUser(participant.userId);
                      if (!participantUser) return null;
                      
                      return (
                        <Badge 
                          key={participant.id} 
                          variant="secondary"
                          className="flex items-center gap-1 py-1 px-2"
                        >
                          <span>{participantUser.fullName}</span>
                          {participant.userId !== user?.id && 
                           roomData.room.type === "internal" && 
                           (roomData.room.createdBy === user?.id || user?.role === "admin") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 rounded-full"
                              onClick={() => removeParticipantMutation.mutate(participant.userId)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                <ScrollArea className="h-[400px] p-4">
                  <div className="space-y-4">
                    {roomData.messages.length === 0 ? (
                      <div className="text-center text-muted-foreground p-4">
                        Aucun message dans cette conversation
                      </div>
                    ) : (
                      roomData.messages.map((message: any) => {
                        const sender = findUser(message.senderId);
                        const isCurrentUser = message.senderId === user?.id;
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`flex max-w-[80%] ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                              <Avatar className={`h-10 w-10 ${isCurrentUser ? "ml-2" : "mr-2"}`}>
                                <AvatarFallback>
                                  {sender ? getInitials(sender.fullName) : "??"}
                                </AvatarFallback>
                                {sender?.avatarUrl && (
                                  <AvatarImage src={sender.avatarUrl} alt={sender.fullName} />
                                )}
                              </Avatar>
                              <div>
                                <div className={`flex items-center ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                                  <span className="text-sm font-medium">
                                    {sender?.fullName || "Utilisateur inconnu"}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {formatDate(message.sentAt)}
                                  </span>
                                </div>
                                <div
                                  className={`mt-1 rounded-lg p-3 ${
                                    isCurrentUser
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted"
                                  }`}
                                >
                                  {/^\[Fichier: .+\]\(.+\)$/.test(message.message) ? (() => {
                                    const match = message.message.match(/^\[Fichier: (.+)\]\((.+)\)$/);
                                    return match ? (
                                      <a
                                        href={match[2]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 underline text-sm"
                                      >
                                        <Paperclip className="h-3 w-3" />
                                        {match[1]}
                                      </a>
                                    ) : message.message;
                                  })() : message.message}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Form {...messageForm}>
                  <form
                    onSubmit={messageForm.handleSubmit(onMessageSubmit)}
                    className="flex w-full gap-2"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-primary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadFileMutation.isPending || !roomId}
                      title="Joindre un fichier"
                    >
                      {uploadFileMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Paperclip className="h-4 w-4" />
                      )}
                    </Button>
                    <FormField
                      control={messageForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                            <Input
                              placeholder="Écrivez votre message..."
                              {...field}
                              className="flex-grow"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={sendMessageMutation.isPending}
                      className="bg-[#f5901d] hover:bg-[#465c50]"
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </Form>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>

      {/* New Chat Room Dialog */}
      <Dialog open={newMessageDialogOpen} onOpenChange={setNewMessageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nouvelle conversation</DialogTitle>
            <DialogDescription>
              Créer une nouvelle conversation {activeTab === "internal" ? "interne" : "avec un client"}
            </DialogDescription>
          </DialogHeader>
          <Form {...roomForm}>
            <form onSubmit={roomForm.handleSubmit(onRoomSubmit)} className="space-y-4">
              <FormField
                control={roomForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de la conversation</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom de la conversation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={roomForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de conversation</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="internal">Interne (Staff)</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {roomForm.watch("type") === "client" && (
                <FormField
                  control={roomForm.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select
                        onValueChange={val => field.onChange(parseInt(val))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clientUsers.map(client => (
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
              )}

              {roomForm.watch("type") === "internal" && (
                <FormField
                  control={roomForm.control}
                  name="participants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Participants</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {field.value?.map(userId => {
                              const participant = staffUsers.find(u => u.id === userId);
                              if (!participant) return null;
                              
                              return (
                                <Badge key={userId} variant="secondary" className="py-1 px-2">
                                  {participant.fullName}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ml-1 h-4 w-4 rounded-full"
                                    onClick={() => {
                                      const newParticipants = field.value?.filter(id => id !== userId) || [];
                                      roomForm.setValue("participants", newParticipants);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              );
                            })}
                          </div>
                          <Select
                            onValueChange={val => {
                              const userId = parseInt(val);
                              const currentParticipants = field.value || [];
                              
                              // Only add if not already included
                              if (!currentParticipants.includes(userId)) {
                                const newParticipants = [...currentParticipants, userId];
                                roomForm.setValue("participants", newParticipants);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Ajouter des participants" />
                            </SelectTrigger>
                            <SelectContent>
                              {staffUsers
                                .filter(u => u.id !== user?.id && !(field.value || []).includes(u.id))
                                .map(staff => (
                                  <SelectItem key={staff.id} value={staff.id.toString()}>
                                    {staff.fullName} ({staff.role})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setNewMessageDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={createRoomMutation.isPending}
                  className="bg-[#f5901d] hover:bg-[#465c50]"
                >
                  {createRoomMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Créer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Participant Dialog */}
      <Dialog open={addParticipantDialogOpen} onOpenChange={setAddParticipantDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Ajouter un participant</DialogTitle>
            <DialogDescription>
              Sélectionnez un utilisateur à ajouter à cette conversation
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              onValueChange={val => {
                addParticipantMutation.mutate(parseInt(val));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                {staffUsers
                  .filter(u => u.id !== user?.id && !isUserAlreadyParticipant(u.id))
                  .map(staff => (
                    <SelectItem key={staff.id} value={staff.id.toString()}>
                      {staff.fullName} ({staff.role})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAddParticipantDialogOpen(false)}
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Transfer Conversation Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Transférer la conversation</DialogTitle>
            <DialogDescription>
              Sélectionnez un agent de service pour transférer cette conversation
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              onValueChange={val => {
                transferConversationMutation.mutate(parseInt(val));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un agent" />
              </SelectTrigger>
              <SelectContent>
                {staffUsers
                  .filter(u => u.id !== user?.id && (u.role === "service" || u.role === "admin"))
                  .map(staff => (
                    <SelectItem key={staff.id} value={staff.id.toString()}>
                      {staff.fullName} ({staff.role})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setTransferDialogOpen(false)}
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </Layout>
  );
}