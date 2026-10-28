"use client";

import React, { createContext, useContext, useState } from 'react';

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  plan?: string;
  role?: string;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  setCurrentOrganization: (org: Organization) => void;
  isLoading: boolean;
}

const DEFAULT_ORG: Organization = {
  id: 'org-chronokairo-local',
  name: 'Chronokairo Workspace',
  slug: 'chronokairo',
  plan: 'enterprise',
  role: 'owner',
};

const OrganizationContext = createContext<OrganizationContextType>({
  currentOrganization: DEFAULT_ORG,
  organizations: [DEFAULT_ORG],
  setCurrentOrganization: () => {},
  isLoading: false,
});

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(DEFAULT_ORG);
  const [organizations] = useState<Organization[]>([DEFAULT_ORG]);
  const [isLoading] = useState(false);

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        setCurrentOrganization,
        isLoading,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganizationContext = () => useContext(OrganizationContext);
