import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const apiClient = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Authorization: `token ${env.GITHUB_PAT}`,
        Accept: 'application/vnd.github.v3+json'
    }
});

export interface GithubRepo {
    name: string;
    full_name: string;
}

export interface GithubCollaborator {
    login: string;
    permissions: {
        admin: boolean;
        push: boolean;
        pull: boolean;
    };
}

const fetchAllPages = async <T>(url: string, params: Record<string, any> = {}): Promise<T[]> => {
    let results: T[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        try {
            const response = await apiClient.get<T[]>(url, {
                params: { ...params, per_page: 100, page }
            });

            if (response.data.length === 0) {
                hasMore = false;
            } else {
                results = results.concat(response.data);
                page++;
            }
        } catch (error: any) {
            if (error.response && error.response.status === 403) {
                 const retryAfter = error.response.headers['retry-after'];
                 const rateLimitReset = error.response.headers['x-ratelimit-reset'];
                 logger.error(`GitHub API rate limit exceeded. Retry after: ${retryAfter}, reset at: ${rateLimitReset}`);
            }
            throw error;
        }
    }

    return results;
};

export const getOrganizationRepos = async (name: string): Promise<GithubRepo[]> => {
    logger.info(`Fetching repositories for org or user: ${name}`);
    try {
        return await fetchAllPages<GithubRepo>(`/orgs/${name}/repos`);
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            logger.info(`Organization not found, checking if it is a user profile: ${name}`);
            return await fetchAllPages<GithubRepo>(`/users/${name}/repos`);
        }
        throw error;
    }
};

export const getRepoCollaborators = async (owner: string, repo: string): Promise<GithubCollaborator[]> => {
    logger.debug(`Fetching collaborators for repo: ${owner}/${repo}`);
    return fetchAllPages<GithubCollaborator>(`/repos/${owner}/${repo}/collaborators`);
};

export const getRepoCollaboratorsSafe = async (owner: string, repo: string): Promise<GithubCollaborator[]> => {
    try {
        return await getRepoCollaborators(owner, repo);
    } catch (error: any) {
         if (error.response?.status === 403 || error.response?.status === 404) {
             logger.warn(`Could not fetch collaborators for ${owner}/${repo} (possibly insufficient permissions). Skipping.`);
             return [];
         }
         throw error;
    }
};
