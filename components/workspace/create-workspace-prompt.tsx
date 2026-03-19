'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { CreateWorkspaceDialog } from './create-workspace-dialog'
import { Building2, Plus } from 'lucide-react'

interface CreateWorkspacePromptProps {
  locale: string
}

export function CreateWorkspacePrompt({ locale }: CreateWorkspacePromptProps) {
  const t = useTranslations()
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="text-center py-24">
        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t('workspace.noWorkspace')}</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          {t('workspace.createFirst')}
        </p>
        <Button onClick={() => setOpen(true)} size="lg" className="gap-2 font-semibold">
          <Plus className="w-4 h-4" />
          {t('workspace.create')}
        </Button>
      </div>

      <CreateWorkspaceDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
