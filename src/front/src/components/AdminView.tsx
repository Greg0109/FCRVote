import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import * as api from '../api';
import * as types from '../types';

export default function AdminView() {
    const [candidateName, setCandidateName] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isPresident, setIsPresident] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [candidates, setCandidates] = useState<types.Candidate[]>([]);
    const [users, setUsers] = useState<types.User[]>([]);

    useEffect(() => {
        handleGetCandidates();
        handleGetUsers();
    }, []);

    const handleAddCandidate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await api.addCandidate(candidateName);
            setMessage(`Candidate "${candidateName}" added successfully.`);
            setCandidateName('');
            await handleGetCandidates();
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to add candidate.';
            setError(errorMsg);
            console.error("Add candidate failed:", errorMsg, err);
        }
    };

    const handleGetCandidates = async () => {
        setMessage('');
        setError('');
        try {
            const response = await api.fetchCandidatesList();
            console.log("Candidates:", response.data);
            setCandidates(response.data);
            setMessage('Candidates fetched successfully. Check console for details.');
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to fetch candidates.';
            setError(errorMsg);
            console.error("Fetch candidates failed:", errorMsg, err);
        }
    }

    const handleRemoveCandidate = async (candidateId: number) => {
        setMessage('');
        setError('');
        try {
            await api.removeCandidate(candidateId);
            setMessage(`Candidate with ID "${candidateId}" removed successfully.`);
            await handleGetCandidates();
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to remove candidate.';
            setError(errorMsg);
            console.error("Remove candidate failed:", errorMsg, err);
        }
    }

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await api.addUser(newUsername, newPassword, isPresident);
            setMessage(`User "${newUsername}" added successfully.`);
            setNewUsername('');
            setNewPassword('');
            setIsPresident(false);
            await handleGetUsers();
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to add user.';
            setError(errorMsg);
            console.error("Add user failed:", errorMsg, err);
        }
    };

    const handleGetUsers = async () => {
        setMessage('');
        setError('');
        try {
            const response = await api.fetchUsers();
            console.log("Users:", response.data);
            for (let i = 0; i < response.data.length; i++) {
                if (response.data[i].username === "admin") {
                    response.data.splice(i, 1);
                    break;
                }
            }
            setUsers(response.data);
            setMessage('Users fetched successfully. Check console for details.');
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to fetch users.';
            setError(errorMsg);
            console.error("Fetch users failed:", errorMsg, err);
        }
    }

    const handleRemoveUser = async (e: number) => {
        setMessage('');
        setError('');
        try {
            await api.removeUser(e); // Replace with actual user ID
            setMessage(`User removed successfully.`);
            await handleGetUsers();
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to remove user.';
            setError(errorMsg);
            console.error("Remove user failed:", errorMsg, err);
        }
    }

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-center">Admin Panel</h2>

            {message && <p className="text-green-600 p-3 bg-green-100 border border-green-300 rounded text-center">{message}</p>}
            {error && <p className="text-red-600 p-3 bg-red-100 border border-red-300 rounded text-center">Error: {error}</p>}

            <Card>
                <CardContent className="pt-6">
                    <h3 className="text-xl font-semibold mb-4">Add Candidate</h3>
                    <form onSubmit={handleAddCandidate} className="space-y-4">
                        <div>
                            <Label htmlFor="candidateName" label="Candidate Name" className="block text-sm font-medium text-gray-700 mb-1" />
                            <Input
                                id="candidateName"
                                value={candidateName}
                                onChange={(e) => setCandidateName(e.target.value)}
                                placeholder="Enter candidate name"
                                required
                                className="mt-1 block w-full"
                            />
                        </div>
                        <Button type="submit" className="w-full">Add Candidate</Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <h3 className="text-xl font-semibold mb-4">Candidates</h3>
                    <div className="space-y-4">
                        {candidates.map((candidate: types.Candidate) => (
                            <div key={candidate.id} className="flex justify-between items-center border p-2 rounded">
                                <span>{candidate.name}</span>
                                <Button onClick={() => handleRemoveCandidate(candidate.id)} className="ml-4">Remove</Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <h3 className="text-xl font-semibold mb-4">Add User</h3>
                    <form onSubmit={handleAddUser} className="space-y-4">
                        <div>
                            <Label htmlFor="newUsername" label="Username" className="block text-sm font-medium text-gray-700 mb-1"/>
                            <Input
                                id="newUsername"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                placeholder="Enter username"
                                required
                                className="mt-1 block w-full"
                            />
                        </div>
                        <div>
                            <Label htmlFor="newPassword" label="Password" className="block text-sm font-medium text-gray-700 mb-1"/>
                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter password"
                                required
                                className="mt-1 block w-full"
                            />
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                htmlFor="isPresidentAdmin"
                                label="Is President (Admin)"
                                checked={isPresident}
                                onChange={(e) => setIsPresident(e.target.checked)}
                            />
                        </div>
                        <Button type="submit" className="w-full">Add User</Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <h3 className="text-xl font-semibold mb-4">Users</h3>
                    <div className="space-y-4">
                        {users.map((user: types.User) => (
                            <div key={user.id} className="flex justify-between items-center border p-2 rounded">
                                <span>{user.username}</span>
                                <Button onClick={() => handleRemoveUser(user.id)} className="ml-4">Remove</Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}