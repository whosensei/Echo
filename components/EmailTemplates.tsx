"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Mail } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  body: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    type: "transcript",
    subject: "",
    bodyContent: "",
    isDefault: false,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/email-templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        type: template.type,
        subject: template.subject,
        bodyContent: template.body,
        isDefault: template.isDefault,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: "",
        type: "transcript",
        subject: "",
        bodyContent: "",
        isDefault: false,
      });
    }
    setDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    try {
      const url = "/api/email-templates";
      const method = editingTemplate ? "PUT" : "POST";
      const body = editingTemplate
        ? { id: editingTemplate.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast({
          title: editingTemplate ? "Template updated" : "Template created",
          description: "Email template saved successfully.",
        });
        setDialogOpen(false);
        fetchTemplates();
      } else {
        throw new Error("Failed to save template");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await fetch(`/api/email-templates?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Template deleted",
          description: "Email template has been removed.",
        });
        fetchTemplates();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template.",
        variant: "destructive",
      });
    }
  };

  const getTypeLabel = (type: string) => {
    return type === "transcript"
      ? "Transcript"
      : type === "summary"
      ? "Summary"
      : "Action Points";
  };

  const getDefaultTemplate = (type: string) => {
    const templates: Record<string, { subject: string; body: string }> = {
      transcript: {
        subject: "Meeting Transcript - {{meetingTitle}}",
        body: `Hello,

Please find attached the transcript from our meeting: {{meetingTitle}}.

Meeting Date: {{meetingDate}}
Duration: {{duration}} minutes

{{transcriptContent}}

Best regards,
Meeting AI`,
      },
      summary: {
        subject: "Meeting Summary - {{meetingTitle}}",
        body: `Hello,

Here's a summary of our meeting: {{meetingTitle}}.

Meeting Date: {{meetingDate}}

Summary:
{{summaryContent}}

Action Points:
{{actionPoints}}

Best regards,
Meeting AI`,
      },
      action_points: {
        subject: "Action Items - {{meetingTitle}}",
        body: `Hello,

Here are the action items from our meeting: {{meetingTitle}}.

{{actionPoints}}

Please review and let me know if you have any questions.

Best regards,
Meeting AI`,
      },
    };

    return templates[type] || templates.transcript;
  };

  if (loading) {
    return <div className="text-center py-8">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Create custom email templates for transcripts, summaries, and action
                points
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No custom templates yet</p>
                <p className="text-sm">
                  Create a template to customize your email format
                </p>
              </div>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{template.name}</h4>
                      {template.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                      <Badge variant="outline">{getTypeLabel(template.type)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Subject: {template.subject}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(template.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "New Email Template"}
            </DialogTitle>
            <DialogDescription>
              Use variables like {"{"}
              {"{"}meetingTitle{"}"}
              {"}"}, {"{"}
              {"{"}meetingDate{"}"}
              {"}"}, {"{"}
              {"{"}transcriptContent{"}"}
              {"}"}, {"{"}
              {"{"}summaryContent{"}"}
              {"}"}, {"{"}
              {"{"}actionPoints{"}"}
              {"}"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="My Custom Template"
              />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transcript">Transcript</SelectItem>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="action_points">Action Points</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                placeholder="Meeting {{meetingTitle}} - Transcript"
              />
            </div>

            <div>
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                value={formData.bodyContent}
                onChange={(e) =>
                  setFormData({ ...formData, bodyContent: e.target.value })
                }
                placeholder="Hello,&#10;&#10;{{transcriptContent}}&#10;&#10;Best regards"
                className="min-h-[200px] font-mono text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) =>
                  setFormData({ ...formData, isDefault: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                Set as default template for this type
              </Label>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                const defaultTemplate = getDefaultTemplate(formData.type);
                setFormData({
                  ...formData,
                  subject: defaultTemplate.subject,
                  bodyContent: defaultTemplate.body,
                });
              }}
            >
              Load Default Template
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
