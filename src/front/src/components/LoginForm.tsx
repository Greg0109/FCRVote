import React, { useState } from 'react';
import {Card, CardContent} from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import './style/label.css';

interface LoginFormProps {
    onLogin: (username: string, password: string) => void;
    error?: string | null;
}

export default function LoginForm({ onLogin, error }: LoginFormProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onLogin(username, password);
    };

    return (
        <Card>
            <CardContent>
                <h2 className="fcr-title">Login</h2>
                {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="username" label="Username" />
                        <br/>
                        <Input
                            id="username"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <br/>
                    <div>
                        <Label htmlFor="password" label="Password" />
                        <br/>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <br/>
                    <Button type="submit" className="fcr-button">
                        Login
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
} 