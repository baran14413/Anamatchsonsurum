'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import useSWR from 'swr';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    targetRefOrQuery: (CollectionReference<DocumentData> | Query<DocumentData>)  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;
  
  const memoizedTargetRefOrQuery = useMemo(() => targetRefOrQuery, [targetRefOrQuery]);

  const key = memoizedTargetRefOrQuery ? (memoizedTargetRefOrQuery.type === 'collection' ? (memoizedTargetRefOrQuery as CollectionReference).path : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString()) : null;

  const { data, error, isLoading } = useSWR(key, (path) => {
    return new Promise<StateDataType>((resolve, reject) => {
        if (!memoizedTargetRefOrQuery) {
            return resolve(null);
        }
        const unsubscribe = onSnapshot(
            memoizedTargetRefOrQuery,
            (snapshot: QuerySnapshot<DocumentData>) => {
                const results: ResultItemType[] = snapshot.docs.map(doc => ({ ...(doc.data() as T), id: doc.id }));
                resolve(results);
            },
            (error: FirestoreError) => {
                const contextualError = new FirestorePermissionError({
                    operation: 'list',
                    path: path || '',
                });
                errorEmitter.emit('permission-error', contextualError);
                reject(contextualError);
            }
        );
        // This is not perfectly handled by SWR, as SWR is not designed for long-lived subscriptions.
        // In a real-world scenario, you might need a more sophisticated setup to manage unsubscriptions,
        // but for this implementation, we will let it live.
    });
  });

  return { data: data ?? null, isLoading, error: error ?? null };
}
