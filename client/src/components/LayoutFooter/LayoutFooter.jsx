// import PropTypes from 'prop-types';
import { Mail, Github } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { useTranslation } from 'react-i18next';

const LayoutFooter = () => {
	const { t } = useTranslation();

	return (
		<footer className="mt-auto py-12 px-6">
			<div className="max-w-7xl mx-auto jx-glass p-10 flex flex-col md:flex-row items-center justify-between gap-8">
				<div className="text-center md:text-left space-y-2">
					<h2 className="text-2xl font-black tracking-tighter text-neutral-900 dark:text-white uppercase">JudgeX</h2>
					<p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">© 2025 JudgeX. Advanced Coding Intelligence.</p>
				</div>
				
				<div className="flex items-center gap-6">
					<Dialog>
						<DialogTrigger asChild>
							<button className="p-3 rounded-2xl bg-neutral-100 dark:bg-white/5 text-neutral-500 hover:text-blue-500 hover:scale-110 transition-all border border-transparent hover:border-blue-500/20">
								<Mail size={20} />
							</button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md jx-glass-strong border-none p-8">
							<DialogHeader>
								<DialogTitle className="jx-h3 text-blue-500">{t('oops')}</DialogTitle>
								<DialogDescription className="text-sm font-medium mt-2">{t('no-mail')} ✉️❌</DialogDescription>
							</DialogHeader>
							<DialogFooter className="sm:justify-start mt-6">
								<DialogClose asChild>
									<Button type="button" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-[10px] font-black uppercase tracking-widest text-white px-6">
										{t('close')}
									</Button>
								</DialogClose>
							</DialogFooter>
						</DialogContent>
					</Dialog>
					
					<a href="https://github.com/Mostafa-khatab" target="_blank" rel="noopener noreferrer" className="p-3 rounded-2xl bg-neutral-100 dark:bg-white/5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:scale-110 transition-all border border-transparent hover:border-white/10">
						<Github size={20} />
					</a>
				</div>
			</div>
		</footer>
	);
};

LayoutFooter.propTypes = {};

export default LayoutFooter;
