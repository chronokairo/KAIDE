"use client";

import { useCallback, useState } from 'react';
import { harnessClient } from '@/modules/dev/harness-client';
import type {
  BrowserScrapeResult,
  CnpjValidationResult,
  ExtractedContacts,
} from '@/modules/dev/harness-client';

export function useHarnessBrowser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('https://google.com');
  const [pageTitle, setPageTitle] = useState<string>('');
  const [treeContent, setTreeContent] = useState<string | null>(null);
  const [scrapeResult, setScrapeResult] = useState<BrowserScrapeResult | null>(null);

  const scrape = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await harnessClient.scrapePage(url);
      if (res.data) {
        setScrapeResult(res.data);
        setCurrentUrl(res.data.url);
        setPageTitle(res.data.title);
      }
      return res.data;
    } catch (err) {
      const msg = String(err);
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAccessibilityScript = useCallback(async () => {
    try {
      const res = await harnessClient.getAccessibilityScript();
      return res.data;
    } catch (err) {
      setError(String(err));
      return null;
    }
  }, []);

  const getClickScript = useCallback(async (selector: string) => {
    try {
      const res = await harnessClient.getClickScript(selector);
      return res.data;
    } catch (err) {
      setError(String(err));
      return null;
    }
  }, []);

  const getSetValueScript = useCallback(async (selector: string, value: string) => {
    try {
      const res = await harnessClient.getSetValueScript(selector, value);
      return res.data;
    } catch (err) {
      setError(String(err));
      return null;
    }
  }, []);

  const validateCnpj = useCallback(async (cnpj: string): Promise<CnpjValidationResult | null> => {
    try {
      const res = await harnessClient.validateCnpj(cnpj);
      return res.data;
    } catch (err) {
      setError(String(err));
      return null;
    }
  }, []);

  const extractContacts = useCallback(async (text: string): Promise<ExtractedContacts | null> => {
    try {
      const res = await harnessClient.extractContacts(text);
      return res.data;
    } catch (err) {
      setError(String(err));
      return null;
    }
  }, []);

  return {
    loading,
    error,
    currentUrl,
    pageTitle,
    treeContent,
    scrapeResult,
    setCurrentUrl,
    scrape,
    getAccessibilityScript,
    getClickScript,
    getSetValueScript,
    validateCnpj,
    extractContacts,
  };
}
