import React, { useState, useEffect, useRef } from 'react';
import { AdminCard, AdminCandidateCard, Card, CardContent } from '../ui/card';
import { AddPhotoButton, RemoveButton, Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import * as api from '../../api';
import * as types from '../../types';
import '../../App.css';
import '../style/unified.css';

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
    const [currentSession, setCurrentSession] = useState<types.VotingSession | null>(null);
    const [pastSessions, setPastSessions] = useState<types.VotingSession[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        handleGetCandidates();
        handleGetUsers();
        handleGetCurrentVotingSessions();
        handleGetAllVotingSessions();
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

    const handleGetCurrentVotingSessions = async () => {
        setMessage('');
        setError('');
        try {
            const response = await api.getCurrentVotingSession();
            console.log("Sessions:", response.data);
            setCurrentSession(response.data);
            setMessage('Sessions fetched successfully. Check console for details.');
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to fetch sessions.';
            setError(errorMsg);
            console.error("Fetch sessions failed:", errorMsg, err);
        }
    }

    const handleGetAllVotingSessions = async () => {
        setMessage('');
        setError('');
        try {
            const response = await api.getAllVotingSessions();
            console.log("All Sessions:", response.data);
            setPastSessions(response.data);
            setMessage('All sessions fetched successfully. Check console for details.');
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to fetch all sessions.';
            setError(errorMsg);
            console.error("Fetch all sessions failed:", errorMsg, err);
        }
    }

    const handleStartVotingSession = async () => {
        setMessage('');
        setError('');
        try {
            const response = await api.startVotingSession();
            console.log("Start Session:", response.data);
            setMessage('Voting session started successfully.');
            await handleGetCurrentVotingSessions();
            await handleGetAllVotingSessions();
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to start voting session.';
            setError(errorMsg);
            console.error("Start session failed:", errorMsg, err);
        }
    }

    const handleEndVotingSession = async () => {
        setMessage('');
        setError('');
        try {
            const response = await api.endVotingSession();
            console.log("End Session:", response.data);
            setMessage('Voting session ended successfully.');
            setCurrentSession(null);
            await handleGetCurrentVotingSessions();
            await handleGetAllVotingSessions();
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to end voting session.';
            setError(errorMsg);
            console.error("End session failed:", errorMsg, err);
        }
    }

    const handleDeleteSession = async (sessionId: number) => {
        setMessage('');
        setError('');
        try {
            await api.deleteVotingSession(sessionId);
            setMessage(`Session with ID "${sessionId}" deleted successfully.`);
            await handleGetAllVotingSessions();
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to delete session.';
            setError(errorMsg);
            console.error("Delete session failed:", errorMsg, err);
        }
    }

    return (
        <div className="admin-grid">
            {/* Candidates Column */}
            <div className="admin-column">
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h3>Add Candidate</h3>
                    </div>
                    <div className="admin-card-body">
                        <form onSubmit={handleAddCandidate}>
                            <div className="admin-form-group">
                                <div className="admin-candidate-form">
                                    <div>
                                        {photo ? (
                                            <AddPhotoButton onClick={UploadPhoto}>
                                                <img src={photo} alt="Uploaded" className="admin-photo-preview" />
                                            </AddPhotoButton>
                                        ) : (
                                            <AddPhotoButton onClick={UploadPhoto}>+</AddPhotoButton>
                                        )}
                                    </div>
                                    <div className="admin-form-group">
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
                                            className="admin-hidden-input"
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
                            </div>
                            <Button type="submit">Add Candidate</Button>
                        </form>
                    </div>
                </div>

                <div className="admin-card">
                    <div className="admin-card-header">
                        <h3>Candidates</h3>
                    </div>
                    <div className="admin-card-body">
                        <div className="admin-list">
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
                </div>
            </div>

            {/* Users Column */}
            <div className="admin-column">
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h3>Add User</h3>
                    </div>
                    <div className="admin-card-body">
                        <form onSubmit={handleAddUser}>
                            <div className="admin-form-group">
                                <Label htmlFor="newUsername" label="Username" />
                                <Input
                                    id="newUsername"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    placeholder="Enter username"
                                    required
                                />
                            </div>
                            <div className="admin-form-group">
                                <Label htmlFor="newPassword" label="Password" />
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter password"
                                    required
                                />
                            </div>
                            <div className="admin-form-group">
                                <Checkbox
                                    htmlFor="isPresident"
                                    label="Is President"
                                    checked={isPresident}
                                    onChange={(e) => setIsPresident(e.target.checked)}
                                />
                            </div>
                            <Button type="submit">Add User</Button>
                        </form>
                    </div>
                </div>

                <div className="admin-card">
                    <div className="admin-card-header">
                        <h3>Users</h3>
                    </div>
                    <div className="admin-card-body">
                        <div className="admin-list">
                            {users.map((user: types.User) => (
                                <div key={user.id} className="admin-list-item">
                                    <span>{user.username}{user.is_president ? ' 👑' : ''}</span>
                                    <RemoveButton onClick={() => handleRemoveUser(user.id)} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sessions Column */}
            <div className="admin-column">
                <div className="admin-card">
                    <div className="admin-card-header">
                        <h3>Voting Sessions</h3>
                    </div>
                    <div className="admin-card-body">
                        {currentSession ? (
                            <div className="admin-session-item admin-active-session">
                                <div className="admin-session-info">
                                    <div className="admin-session-name">{currentSession.name}</div>
                                    <div className="admin-session-description">{currentSession.description}</div>
                                </div>
                                <Button onClick={handleEndVotingSession}>End Session</Button>
                            </div>
                        ) : (
                            <div className="admin-button-group">
                                <Button onClick={handleStartVotingSession}>Start New Session</Button>
                            </div>
                        )}

                        <div className="admin-session-list">
                            <h4>Past Sessions</h4>
                            {pastSessions.length > 0 ? (
                                pastSessions.map((session) => (
                                    <div key={session.id} className="admin-session-item">
                                        <div className="admin-session-info">
                                            <div className="admin-session-name">{session.name}</div>
                                            <div className="admin-session-description">{session.description}</div>
                                        </div>
                                        <Button onClick={() => handleDeleteSession(session.id)}>Delete</Button>
                                    </div>
                                ))
                            ) : (
                                <p>No past sessions available.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {message && <div className="fcr-message">{message}</div>}
            {error && <div className="fcr-error">Error: {error}</div>}
        </div>
    );
}