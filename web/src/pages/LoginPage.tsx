import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { useLoginMutation } from '../api/authApi';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import type { AppDispatch } from '../app/store';

export function LoginPage() {
	const navigate = useNavigate();
	const dispatch = useDispatch<AppDispatch>();
	const [login, { isLoading, error }] = useLoginMutation();

	const [formData, setFormData] = useState({
		email: '',
		password: '',
	});
	const [formErrors, setFormErrors] = useState<{
		email?: string;
		password?: string;
	}>({});

	const validate = () => {
		const errors: typeof formErrors = {};
		if (!formData.email) {
			errors.email = 'Email is required';
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			errors.email = 'Email is invalid';
		}
		if (!formData.password) {
			errors.password = 'Password is required';
		} else if (formData.password.length < 6) {
			errors.password = 'Password must be at least 6 characters';
		}
		setFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validate()) return;

		try {
			await login(formData).unwrap();
			navigate('/');
		} catch (err: unknown) {
			// Error is handled by RTK Query
			console.error('Login failed:', err);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		if (formErrors[name as keyof typeof formErrors]) {
			setFormErrors((prev) => ({ ...prev, [name]: undefined }));
		}
	};

	return (
		<div 
			className="flex min-h-screen items-center justify-center px-4"
			style={{ backgroundColor: 'var(--color-bg-primary)' }}
		>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className="w-full max-w-md space-y-8 rounded-2xl p-8 shadow-xl"
				style={{ backgroundColor: 'var(--color-bg-secondary)' }}
			>
				<div className="text-center">
					<h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>EchoRoom</h1>
					<p className="mt-2" style={{ color: 'var(--color-text-tertiary)' }}>Sign in to your account</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					{error && 'data' in error && (
						<div className="rounded-lg bg-red-900/20 border border-red-800 p-3 text-sm text-red-400">
							{'message' in (error.data as { message?: string })
								? (error.data as { message: string }).message
								: 'Login failed. Please try again.'}
						</div>
					)}

					<Input
						label="Email"
						type="email"
						name="email"
						value={formData.email}
						onChange={handleChange}
						error={formErrors.email}
						placeholder="you@example.com"
						autoComplete="email"
						required
					/>

					<Input
						label="Password"
						type="password"
						name="password"
						value={formData.password}
						onChange={handleChange}
						error={formErrors.password}
						placeholder="••••••••"
						autoComplete="current-password"
						required
					/>

					<Button
						type="submit"
						variant="primary"
						size="lg"
						isLoading={isLoading}
						className="w-full"
					>
						Sign in
					</Button>
				</form>

				<div className="text-center text-sm">
					<span className="text-gray-400">Don't have an account? </span>
					<Link
						to="/register"
						className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
					>
						Sign up
					</Link>
				</div>
			</motion.div>
		</div>
	);
}
