'use client';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { LogOut, Moon, Sun, User } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';

export function ProfileDropdown() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleSignOut = () => {
    console.log('Signing out...');
  };

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
            className="h-10 w-10 glass-enhanced border-border/30 hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <User className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-52 glass-enhanced border-border/30"
          sideOffset={8}
        >
          <div className="px-3 py-3">
            <p className="text-sm font-medium text-foreground">John Doe</p>
            <p className="text-xs text-muted-foreground">john@example.com</p>
          </div>
          
          <DropdownMenuSeparator className="bg-border/30" />
          
          <DropdownMenuItem 
            onClick={toggleTheme}
            className="hover:bg-muted/50 transition-colors duration-200"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="mr-2 h-4 w-4" />
                Light mode
              </>
            ) : (
              <>
                <Moon className="mr-2 h-4 w-4" />
                Dark mode
              </>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-border/30" />
          
          <DropdownMenuItem 
            onClick={handleSignOut} 
            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors duration-200"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
