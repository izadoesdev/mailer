import React from 'react';
import { Column, Spinner, Text, Icon } from '@/once-ui/components';
import { ContactCard } from './ContactCard';
import type { Contact } from '../types';

interface ContactListProps {
  contacts: Contact[];
  isLoading: boolean;
  isError: boolean;
  onSelectContact?: (contact: Contact) => void;
  selectedContactId?: string;
  errorMessage?: string | null;
}

export function ContactList({ 
  contacts, 
  isLoading, 
  isError, 
  onSelectContact,
  selectedContactId,
  errorMessage
}: ContactListProps) {
  if (isLoading) {
    return (
      <Column fill gap="16" horizontal="center" vertical="center">
        <Spinner size="l" />
        <Text>Loading contacts...</Text>
      </Column>
    );
  }

  if (isError) {
    return (
      <Column fill gap="12" horizontal="center" vertical="center">
        <Icon name="errorCircle" size="l" color="danger" />
        <Text>Failed to load contacts</Text>
        {errorMessage && (
          <Text variant="body-default-s" onBackground="neutral-weak" style={{ textAlign: 'center', maxWidth: '400px' }}>
            {errorMessage}
          </Text>
        )}
      </Column>
    );
  }

  if (contacts.length === 0) {
    return (
      <Column fill gap="12" horizontal="center" vertical="center">
        <Icon name="mail" size="l" />
        <Text>No contacts found</Text>
        <Text variant="body-default-s" onBackground="neutral-weak">
          Try changing your search filters
        </Text>
      </Column>
    );
  }

  return (
    <Column fill gap="16" paddingY="16">
      {contacts.map((contact) => (
        <ContactCard 
          key={contact.email} 
          contact={contact} 
          onClick={() => onSelectContact?.(contact)}
          selected={selectedContactId === contact.email}
        />
      ))}
    </Column>
  );
} 