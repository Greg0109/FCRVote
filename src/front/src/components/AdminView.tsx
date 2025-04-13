import React, { useState, useEffect, useRef } from 'react';
import { AdminCard, AdminCandidateCard, Card, CardContent } from './ui/card';
import { AddPhotoButton, RemoveButton, Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import * as api from '../api';
import * as types from '../types';
import '../App.css';

export default function AdminView() {
    const [candidateName, setCandidateName] = useState('');
    const [candidateDescription, setCandidateDescription] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isPresident, setIsPresident] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [candidates, setCandidates] = useState<types.Candidate[]>([]);
    const [users, setUsers] = useState<types.User[]>([]);
    const [photo, setPhoto] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        handleGetCandidates();
        handleGetUsers();
    }, []);

    const handleAddCandidate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await api.addCandidate(candidateName, photo, candidateDescription);
            setMessage(`Candidate "${candidateName}" added successfully.`);
            setPhoto('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setCandidateName('');
            setCandidateDescription('');
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

    const UploadPhoto = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setMessage('');
        setError('');
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64String = reader.result as string;
                setPhoto(base64String);
                console.log("Base64 photo string:", base64String);
                setMessage('Photo uploaded successfully.');
            };
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to upload photo.';
            setError(errorMsg);
            console.error("Photo upload failed:", errorMsg, err);
        }
    };

    return (
        <div>
            <h2>Admin Panel</h2>

            {message && <p>{message}</p>}
            {error && <p>Error: {error}</p>}

            <AdminCard>
                <div>
                    <Card>
                        <CardContent style={{ minHeight: '210px' }}>
                            <h3>Add Candidate</h3>
                            <form onSubmit={handleAddCandidate}>
                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                                    <div>
                                        {photo ? (
                                            <AddPhotoButton onClick={UploadPhoto}>
                                                <img src={photo} alt="Uploaded" style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
                                            </AddPhotoButton>
                                        ) : (
                                            <AddPhotoButton onClick={UploadPhoto}>+</AddPhotoButton>
                                        )}
                                    </div>
                                    <div>
                                        <Input
                                            id="candidatePhoto"
                                            type="text"
                                            value={photo}
                                            readOnly
                                            required
                                            hidden
                                        />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            ref={fileInputRef}
                                            style={{ display: 'none' }}
                                            onChange={handlePhotoUpload}
                                            hidden
                                        />
                                        <Input
                                            id="candidateName"
                                            value={candidateName}
                                            onChange={(e) => setCandidateName(e.target.value)}
                                            placeholder="Enter candidate name"
                                            required
                                        />
                                        <br/>
                                        <Input
                                            id="candidateDescription"
                                            type="text"
                                            value={candidateDescription}
                                            onChange={(e) => setCandidateDescription(e.target.value)}
                                            placeholder="Enter candidate description"
                                            required
                                        />
                                    </div>
                                </div>
                                <br/>
                                <Button type="submit">Add Candidate</Button>
                            </form>
                        </CardContent>
                    </Card>

                    <br/>

                    <Card>
                        <CardContent>
                            <div>
                                <h3>Candidates</h3>
                                <div>
                                    {candidates.map((candidate: types.Candidate) => (
                                        <AdminCandidateCard
                                            key={candidate.id}
                                            photo={candidate.photo}
                                            name={candidate.name}
                                            description={candidate.description}
                                            onRemove={() => handleRemoveCandidate(candidate.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardContent>
                            <h3>Add User</h3>
                            <form onSubmit={handleAddUser}>
                                <div>
                                    <Label htmlFor="newUsername" label="Username" />
                                    <br/>
                                    <Input
                                        id="newUsername"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        placeholder="Enter username"
                                        required
                                    />
                                </div>
                                <br/>
                                <div>
                                    <Label htmlFor="newPassword" label="Password" />
                                    <br/>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter password"
                                        required
                                    />
                                </div>
                                <br/>
                                <div>
                                    <Checkbox
                                        htmlFor="isPresident"
                                        label="Is President"
                                        checked={isPresident}
                                        onChange={(e) => setIsPresident(e.target.checked)}
                                    />
                                </div>
                                <Button type="submit">Add User</Button>
                            </form>
                        </CardContent>
                    </Card>

                    <br/>

                    <Card>
                        <CardContent>
                            <h3>Users</h3>
                            <div>
                                {users.map((user: types.User) => (
                                    <div key={user.id} className="align-horizontal">
                                        <Label htmlFor="" label={`${user.username}${user.is_president ? ' 👑' : ''}`}/>
                                        <RemoveButton onClick={() => handleRemoveUser(user.id)}></RemoveButton>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AdminCard>
        </div>
    );
}