"use client";

import type { Email } from "./types";
import { Row, Column, Card, useToast, Text } from "@/once-ui/components";
import { EmailList } from "./components/EmailList";
import { EmailDetail } from "./components/EmailDetail";
import { InboxControls } from "./components/InboxControls";
import { Pagination } from "./components/Pagination";
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "./hooks/useDebounce";
import { useInboxData } from "./hooks/useInboxData";
import { useEmailMutations } from "./hooks/useEmailMutations";
import { useBackgroundSync } from "./hooks/useBackgroundSync";
import { useAISearch } from "./hooks/useAISearch";
import { useState, useCallback, useEffect, useRef } from "react";
import { useUser } from "@/libs/auth/client";
import { useRouter } from "next/navigation";

export default function InboxPage() {
    // Authentication check
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useUser();
    
    // State
    const [searchQuery, setSearchQuery] = useState("");
    const [threadView, setThreadView] = useState(true);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const hasSyncedRef = useRef(false);

    // Hooks
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const isAuthenticated = !!user && !isAuthLoading;

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.push("/login");
        }
    }, [user, isAuthLoading, router]);

    // Only fetch emails if user is authenticated
    const { emails, totalPages, totalCount, isLoading, isFetching } = useInboxData({
        page,
        pageSize,
        threadView,
        searchQuery: debouncedSearchQuery,
        enabled: isAuthenticated,
    });

    // Use AI search hook
    const { 
        similarEmails, 
        isAISearchActive, 
        isAISearchLoading, 
        performAISearch,
        clearAISearch
    } = useAISearch();

    // Pass authentication state to hooks
    const { markAsRead, toggleStar } = useEmailMutations({ enabled: isAuthenticated });
    const { triggerSync, isSyncing } = useBackgroundSync({ enabled: isAuthenticated });

    // Trigger a sync when the inbox is first loaded, but only once
    useEffect(() => {
        // Only trigger on first render, when authenticated, and not already synced
        if (isAuthenticated && !hasSyncedRef.current && !isLoading && !isFetching) {
            hasSyncedRef.current = true; // Mark as synced to prevent future attempts
            triggerSync();
        }
    }, [isAuthenticated, isLoading, isFetching, triggerSync]);

    // Handle email selection
    const handleEmailSelect = useCallback(
        (email: Email) => {
            setSelectedEmail((prev) => (prev?.id === email.id ? null : email));
            if (!email.isRead) {
                markAsRead.mutate(email.id);
            }
        },
        [markAsRead],
    );

    // Toggle star status
    const handleToggleStar = useCallback(
        (email: Email, e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            toggleStar.mutate({
                emailId: email.id,
                isStarred: !email.isStarred,
            });
        },
        [toggleStar],
    );

    // Handle search
    const handleSearchChange = useCallback((query: string) => {
        setSearchQuery(query);
        setPage(1); // Reset to first page on new search
    }, []);
    
    // Handle AI search
    const handleAISearch = useCallback((query: string) => {
        performAISearch(query);
        // No need to update page since we're showing a different view
    }, [performAISearch]);
    
    // Handle clear AI search
    const handleClearAISearch = useCallback(() => {
        clearAISearch();
    }, [clearAISearch]);

    // Handle page change
    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    // Handle page size change
    const handlePageSizeChange = useCallback((size: number) => {
        setPageSize(size);
        setPage(1);
    }, []);

    // Toggle thread view
    const handleThreadViewChange = useCallback(() => {
        setThreadView((prev) => !prev);
        setPage(1);
    }, []);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["emails"] });
    }, [queryClient]);

    // Handle sync
    const handleSync = useCallback(() => {
        triggerSync();
    }, [triggerSync]);

    // Calculate width for main content
    const mainContentWidth = selectedEmail ? "40%" : "100%";
    
    // Determine which emails to display based on AI search status
    const displayEmails = isAISearchActive ? similarEmails : emails;
    const displayTotalCount = isAISearchActive ? similarEmails.length : totalCount;

    // Conditional rendering logic
    if (isAuthLoading) {
        return (
            <Column fill paddingY="20" horizontal="center" vertical="center">
                <Text variant="heading-default-l">Loading...</Text>
            </Column>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <Row fill paddingY="20" gap="32">
            <Column
                fillWidth
                style={{
                    width: mainContentWidth,
                    transition: "width 0.3s ease",
                }}
            >
                <InboxControls
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    threadView={threadView}
                    onThreadViewChange={handleThreadViewChange}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    onRefresh={handleRefresh}
                    onSync={handleSync}
                    isSyncing={isSyncing}
                    pageSize={pageSize}
                    onPageSizeChange={handlePageSizeChange}
                    onAISearch={handleAISearch}
                    onClearAISearch={handleClearAISearch}
                    isAISearchActive={isAISearchActive}
                    isAISearchLoading={isAISearchLoading}
                />

                <Column fill overflow="hidden">
                    <EmailList
                        emails={displayEmails}
                        isLoading={isAISearchActive ? isAISearchLoading : isLoading}
                        selectedEmailId={selectedEmail?.id || null}
                        searchQuery={debouncedSearchQuery}
                        onSelectEmail={handleEmailSelect}
                        onToggleStar={handleToggleStar}
                    />
                </Column>

                {/* Only show pagination for regular inbox, not for AI search results */}
                {!isAISearchActive && (
                  <Pagination
                      page={page}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      isLoading={isLoading}
                      isFetching={isFetching}
                      pageSize={pageSize}
                      totalCount={totalCount}
                  />
                )}
                
                {/* Show a simple count for AI search results */}
                {isAISearchActive && (
                  <Row paddingX="16" marginTop="16" horizontal="center">
                    <Text variant="body-default-m">
                      Found {similarEmails.length} similar emails
                    </Text>
                  </Row>
                )}
            </Column>

            {selectedEmail && (
                <Column
                    flex={1}
                    fillHeight
                    style={{
                        width: "60%",
                        transition: "width 0.3s ease",
                    }}
                >
                    <EmailDetail 
                        email={selectedEmail} 
                        onClose={() => setSelectedEmail(null)}
                        onToggleStar={handleToggleStar}
                    />
                </Column>
            )}
        </Row>
    );
}
