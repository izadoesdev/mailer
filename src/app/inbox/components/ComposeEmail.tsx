import { useState, useRef, useEffect } from "react";
import {
  Button,
  Column,
  Input,
  Row,
  Text,
  IconButton,
  useToast,
  Line,
} from "@/once-ui/components";
import { useEmailMutations } from "../hooks/useEmailMutations";

interface ComposeEmailProps {
  threadId?: string;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type EnhancementType = "improve" | "shorten" | "formal" | "friendly";

export function ComposeEmail({
  threadId,
  initialTo = "",
  initialSubject = "",
  initialBody = "",
  onClose,
  onSuccess,
}: ComposeEmailProps) {
  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Enhancement states
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedContent, setEnhancedContent] = useState("");
  const [showEnhancementOptions, setShowEnhancementOptions] = useState(false);
  const [enhancementType, setEnhancementType] = useState<EnhancementType>("improve");
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  
  const bodyRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();
  
  const { sendEmail } = useEmailMutations();

  // Set up contentEditable div as rich text editor
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.contentEditable = "true";
      bodyRef.current.innerHTML = initialBody;
      bodyRef.current.focus();
    }
  }, [initialBody]);

  // Handle body changes from contentEditable div
  const handleBodyChange = () => {
    if (bodyRef.current) {
      setBody(bodyRef.current.innerHTML);
    }
  };

  // Handle text selection
  const handleTextSelection = () => {
    if (!bodyRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    // Check if selection is within the body editor
    if (!bodyRef.current.contains(range.commonAncestorContainer)) return;
    
    // Get selected text
    const text = selection.toString().trim();
    if (text.length > 0) {
      setSelectedText(text);
      // Save selection range to restore later
      const bodyContent = bodyRef.current.innerHTML;
      const startOffset = bodyContent.indexOf(text);
      if (startOffset >= 0) {
        setSelectionRange({
          start: startOffset,
          end: startOffset + text.length
        });
      }
    }
  };

  // Handle enhancement request
  const handleEnhance = async () => {
    if (!body.trim()) {
      addToast({
        variant: "danger",
        message: "Cannot enhance empty content"
      });
      return;
    }

    setIsEnhancing(true);

    try {
      const textToEnhance = selectedText || body;
      const res = await fetch('/api/inbox/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: textToEnhance,
          action: enhancementType,
        }),
      });
      
      if (!res.ok) {
        throw new Error('Enhancement request failed');
      }
      
      const data = await res.json();
      if (data.success && data.enhancedContent) {
        setEnhancedContent(data.enhancedContent);
        setShowEnhancementOptions(false);
      } else {
        throw new Error(data.error || 'Failed to enhance content');
      }
    } catch (error) {
      console.error("Error enhancing content:", error);
      addToast({
        variant: "danger",
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  // Apply enhanced content
  const applyEnhancement = () => {
    if (!enhancedContent || !bodyRef.current) return;
    
    if (selectedText && selectionRange) {
      // Replace just the selected portion
      const currentContent = bodyRef.current.innerHTML;
      const beforeSelection = currentContent.substring(0, selectionRange.start);
      const afterSelection = currentContent.substring(selectionRange.end);
      
      bodyRef.current.innerHTML = beforeSelection + enhancedContent + afterSelection;
    } else {
      // Replace entire body
      bodyRef.current.innerHTML = enhancedContent;
    }
    
    // Update state and clear enhancement data
    setBody(bodyRef.current.innerHTML);
    setEnhancedContent("");
    setSelectedText("");
    setSelectionRange(null);
    
    addToast({
      variant: "success",
      message: "Changes applied successfully"
    });
  };

  // Dismiss enhancement
  const dismissEnhancement = () => {
    setEnhancedContent("");
    setSelectedText("");
    setSelectionRange(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!to.trim()) {
      addToast({
        variant: "danger",
        message: "Please enter at least one recipient"
      });
      return;
    }

    if (!subject.trim()) {
      addToast({
        variant: "danger",
        message: "Are you sure you want to send without a subject?"
      });
      // Continue anyway
    }

    if (!body.trim()) {
      addToast({
        variant: "danger",
        message: "Are you sure you want to send an empty message?"
      });
      // Continue anyway
    }

    setIsSending(true);

    try {
      await sendEmail.mutateAsync({
        to,
        cc: cc || undefined,
        bcc: bcc || undefined,
        subject,
        body,
        threadId,
      });

      addToast({
        variant: "success",
        message: "Your email has been sent successfully"
      });

      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error("Error sending email:", error);
      addToast({
        variant: "danger",
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Row
      padding="0"
      maxWidth={40}
      maxHeight={48}
      overflow="hidden"
      background="neutral-weak"
      border="neutral-alpha-medium"
      radius="m"
      position="fixed"
      bottom="8"
      right="8"
      zIndex={9}
    >
      <form onSubmit={handleSubmit} style={{ height: "100%", width: "100%" }}>
        <Column fill>
          <Row
            horizontal="space-between"
            vertical="center"
            paddingY="8"
            paddingX="16"
            background="neutral-alpha-weak"
            borderBottom="neutral-alpha-medium"
          >
            <Text variant="heading-strong-s">New email</Text>
            <IconButton
              tooltip="Close"
              tooltipPosition="left"
              variant="ghost"
              icon="close"
              onClick={onClose}
            />
          </Row>

          <Input 
              style={{ border: "1px solid transparent" }}
              id="to"
              label="To"
              radius="none"
              value={to}
              labelAsPlaceholder
              hasSuffix={
                !showCcBcc && (
                    <Button
                        data-border="rounded"
                        variant="secondary"
                        prefixIcon="plus"
                        label="Add people"
                        size="s"
                        onClick={() => setShowCcBcc(true)}
                    />
                )
            }
              onChange={(e) => setTo(e.target.value)}
              required
            />

            <Line background="neutral-alpha-medium"/>

            {showCcBcc && (
              <>
                <Input 
                  radius="none"
                  style={{ border: "1px solid transparent" }}
                  id="cc"
                  label="Cc"
                  value={cc}
                  labelAsPlaceholder
                  onChange={(e) => setCc(e.target.value)}
                />
                <Line background="neutral-alpha-medium"/>
                <Input 
                  radius="none"
                  style={{ border: "1px solid transparent" }}
                  id="bcc"
                  label="Bcc"
                  value={bcc}
                  labelAsPlaceholder
                  onChange={(e) => setBcc(e.target.value)}
                />
                <Line background="neutral-alpha-medium"/>
              </>
            )}

            <Input 
              radius="none"
              style={{ border: "1px solid transparent" }}
              id="subject"
              label="Subject"
              value={subject}
              labelAsPlaceholder
              onChange={(e) => setSubject(e.target.value)}
            />

            <Line background="neutral-alpha-medium"/>

          <Column fill overflow="auto">
            <Column fillWidth fitHeight>
              <div
                ref={bodyRef}
                onInput={handleBodyChange}
                style={{
                  minHeight: "200px",
                  border: "1px solid var(--color-neutral-alpha-medium)",
                  borderRadius: "var(--radius-m)",
                  padding: "12px",
                  outline: "none",
                  overflowY: "auto",
                }}
              />
            </Column>
          </Column>

          <Row
            gap="8"
            horizontal="end"
            borderTop="neutral-alpha-medium"
            paddingY="12"
            paddingX="20"
            background="neutral-alpha-weak"
          >
            <Row maxWidth={6}>
              <Button
                fillWidth
                suffixIcon={isSending ? "" : "send"}
                data-border="rounded"
                type="submit" 
                label={isSending ? "" : "Send"}
                loading={isSending}
                disabled={isSending || !to.trim()} 
              />
            </Row>
          </Row>
        </Column>
      </form>
    </Row>
  );
} 