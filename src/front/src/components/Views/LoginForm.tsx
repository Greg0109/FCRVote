import React, { useState } from 'react';
import {Card, CardContent} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import '../style/unified.css';

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
                {error && <p className="login-error">{error}</p>}
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="label-input-wrapper">
                        <Label htmlFor="username" label="Username" />
                        <Input
                            id="username"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="input-margin"
                        />
                    </div>
                    <div className="label-input-wrapper">
                        <Label htmlFor="password" label="Password" />
                        <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="input-margin"
                        />
                    </div>
                    <Button type="submit" className="fcr-button">
                        Login
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
} 