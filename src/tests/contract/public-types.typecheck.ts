import { expectTypeOf } from 'vitest'
import type { CalendarListProps } from '../../lib/components/sidebar/CalendarList/calendar-list.types.js'
import type { SchedulerProps } from '../../lib/components/Scheduler/scheduler.types.js'
import type { LayoutContext } from '../../lib/types/layout.types.js'

type SchedulerUi = keyof NonNullable<SchedulerProps['ui']>
type CalendarListUi = keyof NonNullable<CalendarListProps['ui']>

expectTypeOf<'bodyReversed'>().not.toExtend<SchedulerUi>()
expectTypeOf<'sidebarEnd'>().not.toExtend<SchedulerUi>()
expectTypeOf<'root'>().toExtend<SchedulerUi>()
expectTypeOf<'sidebar'>().toExtend<SchedulerUi>()

expectTypeOf<'nameHidden'>().not.toExtend<CalendarListUi>()
expectTypeOf<'name'>().toExtend<CalendarListUi>()

expectTypeOf<LayoutContext>().not.toHaveProperty('maxLanes')
expectTypeOf<LayoutContext>().toHaveProperty('columnsPerRow')
