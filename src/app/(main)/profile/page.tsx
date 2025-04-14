"use client";

import { useState, Suspense } from "react";
import {
  Heading,
  Text,
  Button,
  Avatar,
  Row,
  Column,
  IconButton,
  Icon,
  Card,
  SegmentedControl,
  Spinner,
} from "@/once-ui/components";
import { useUser } from "@/libs/auth/client";
import { useQueryState } from "nuqs";
import ProfileInfo from "./components/ProfileInfo";
import EmailSettings from "./components/EmailSettings";
import SecuritySettings from "./components/SecuritySettings";
import AISettings from "./components/AISettings";
import ConnectedAccounts from "./components/ConnectedAccounts";

// Profile category options
const PROFILE_CATEGORIES = [
  { value: "profile", label: "Profile", icon: "person" },
  { value: "email", label: "Email Notifications", icon: "mail" },
  { value: "ai", label: "AI Preferences", icon: "sparkles" },
  { value: "accounts", label: "Connected Accounts", icon: "link" },
  { value: "security", label: "Security", icon: "shield" }
];

function ProfileContent() {
  const { user, isLoading, error } = useUser();
  const [tab, setTab] = useQueryState("tab", { 
    defaultValue: "profile",
    history: "push",
    parse: (value) => PROFILE_CATEGORIES.some(c => c.value === value) ? value : "profile"
  });
  
  // If loading or error, show appropriate state
  if (isLoading) {
    return (
      <Column fillWidth fillHeight horizontal="center" vertical="center" gap="20">
        <Spinner size="l" />
        <Text>Loading your profile...</Text>
      </Column>
    );
  }
  
  if (error || !user) {
    return (
      <Column fillWidth fillHeight horizontal="center" vertical="center" gap="20">
        <Icon name="errorCircle" size="l" color="danger" />
        <Text>Unable to load your profile. Please try again later.</Text>
        <Button label="Refresh" variant="primary" onClick={() => window.location.reload()} />
      </Column>
    );
  }

  // Get the current category label
  const currentCategory = PROFILE_CATEGORIES.find(c => c.value === tab);
  
  return (
    <Row fillWidth fillHeight gap="0">
      {/* Left sidebar */}
      <Column 
        width={16} 
        minWidth={16} 
        fillHeight 
        background="neutral-alpha-weak" 
        border="neutral-alpha-medium" 
        style={{
          borderTop: 'none',
          borderLeft: 'none',
          borderBottom: 'none'
        }}
        paddingTop="32"
        paddingX="16"
        gap="24"
      >
        <Column gap="16" horizontal="center" paddingX="16">
          <Avatar 
            src={user?.image || ""}
            size="xl"
          />
          <Column gap="4" horizontal="center">
            <Heading variant="heading-strong-m">{user?.name || "Your Profile"}</Heading>
            <Text variant="body-default-s" onBackground="neutral-weak" style={{ textAlign: 'center' }}>
              {user?.email}
            </Text>
          </Column>
        </Column>
        
        <Column gap="8" fillWidth>
          {PROFILE_CATEGORIES.map((category) => (
            <Button
              key={category.value}
              label={category.label}
              variant={tab === category.value ? "primary" : "tertiary"}
              size="l"
              prefixIcon={category.icon}
              fillWidth
              onClick={() => setTab(category.value)}
              justifyContent="start"
            />
          ))}
        </Column>
      </Column>
      
      {/* Main content */}
      <Column fill paddingY="32" paddingX="l" gap="32" overflowY="auto">
        <Row vertical="center" horizontal="space-between" fillWidth style={{ borderBottom: '1px solid var(--border-neutral-alpha-medium)' }} paddingBottom="16">
          <Row vertical="center" gap="12">
            <Icon name={currentCategory?.icon || "person"} size="m" />
            <Heading variant="heading-strong-l">{currentCategory?.label || "Profile"}</Heading>
          </Row>
          {tab === "profile" && (
            <Text variant="body-default-xs" onBackground="neutral-weak">
              <Icon name="infoCircle" size="xs" /> Email address cannot be updated
            </Text>
          )}
        </Row>
        
        <Column gap="24" fillWidth>
          <Suspense fallback={<LoadingContent />}>
            {tab === "profile" && (
              <ProfileInfo user={user} />
            )}
            
            {tab === "email" && (
              <EmailSettings user={user} />
            )}
            
            {tab === "ai" && (
              <AISettings user={user} />
            )}
            
            {tab === "security" && (
              <SecuritySettings user={user} />
            )}
            
            {tab === "accounts" && (
              <ConnectedAccounts user={user} />
            )}
          </Suspense>
        </Column>
      </Column>
    </Row>
  );
}

function LoadingContent() {
  return (
    <Card>
      <Column padding="l" gap="m" horizontal="center">
        <Spinner size="m" />
        <Text>Loading content...</Text>
      </Column>
    </Card>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingContent />}>
      <ProfileContent />
    </Suspense>
  );
} 