import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import StatusBadge from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Utility function to get days in month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

// Utility function to get first day of month (0 = Sunday)
const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

export default function SchedulePage() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const { data: events, isLoading, error } = useQuery({
    queryKey: ["/api/schedule"],
  });
  
  // Navigate to previous month
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  // Navigate to next month
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];
    
    // Previous month days
    const prevMonthDays = firstDay;
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);
    
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        month: prevMonth,
        year: prevMonthYear,
        isCurrentMonth: false,
        events: []
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Find events for this day
      const dayEvents = events?.filter((event: any) => {
        const eventDate = new Date(event.start);
        return eventDate.toISOString().split('T')[0] === dateStr;
      }) || [];
      
      days.push({
        day: i,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true,
        isToday: date.toDateString() === new Date().toDateString(),
        events: dayEvents
      });
    }
    
    // Next month days to fill the calendar
    const totalDaysSoFar = days.length;
    const nextDaysNeeded = 42 - totalDaysSoFar; // 6 rows of 7 days
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    
    for (let i = 1; i <= nextDaysNeeded; i++) {
      days.push({
        day: i,
        month: nextMonth,
        year: nextMonthYear,
        isCurrentMonth: false,
        events: []
      });
    }
    
    return days;
  };
  
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  
  const weekDays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  
  const calendarDays = generateCalendarDays();
  
  // Getting upcoming events for the side panel
  const today = new Date();
  const upcomingEvents = events?.filter((event: any) => {
    const eventDate = new Date(event.start);
    return eventDate >= today;
  }).sort((a: any, b: any) => {
    return new Date(a.start).getTime() - new Date(b.start).getTime();
  }).slice(0, 5) || [];
  
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-xl text-red-500">Échec de chargement des données du calendrier</h1>
          <p className="text-gray-600">Veuillez rafraîchir la page</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendrier</h1>
        <p className="text-sm text-gray-600">
          Consultez et gérez les rendez-vous de service
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-9">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Calendrier de service</CardTitle>
                <div className="flex items-center">
                  <Button variant="outline" size="sm" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="mx-4 font-medium">
                    {monthNames[currentMonth]} {currentYear}
                  </span>
                  <Button variant="outline" size="sm" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Week Days */}
              <div className="grid grid-cols-7 gap-1 text-center font-medium text-sm mb-2">
                {weekDays.map((day) => (
                  <div key={day} className="py-2 text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-[80px] p-1 border relative ${
                      day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
                    } ${day.isToday ? 'border-primary' : 'border-gray-200'}`}
                  >
                    <div className={`text-sm p-1 ${
                      day.isToday ? 'font-bold bg-primary text-white rounded-full h-6 w-6 flex items-center justify-center' : ''
                    }`}>
                      {day.day}
                    </div>
                    
                    {/* Events */}
                    <div className="mt-1 space-y-1">
                      {day.events.slice(0, 2).map((event: any, i: number) => (
                        <div
                          key={i}
                          className="text-xs p-1 rounded truncate"
                          style={{
                            backgroundColor: event.type === 'warranty' ? 'rgba(79, 70, 229, 0.1)' : 
                                             event.type === 'insurance' ? 'rgba(245, 158, 11, 0.1)' :
                                             'rgba(16, 185, 129, 0.1)',
                            color: event.type === 'warranty' ? 'rgb(79, 70, 229)' : 
                                   event.type === 'insurance' ? 'rgb(245, 158, 11)' :
                                   'rgb(16, 185, 129)'
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      
                      {day.events.length > 2 && (
                        <div className="text-xs text-gray-500 p-1">
                          +{day.events.length - 2} de plus
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Upcoming Events */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Rendez-vous à venir</CardTitle>
              <CardDescription>
                Les 5 prochains rendez-vous de service
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event: any) => (
                    <div
                      key={event.id}
                      className="border-l-4 pl-3 py-2"
                      style={{
                        borderLeftColor: event.type === 'warranty' ? 'rgb(79, 70, 229)' : 
                                        event.type === 'insurance' ? 'rgb(245, 158, 11)' :
                                        'rgb(16, 185, 129)'
                      }}
                    >
                      <div className="flex justify-between">
                        <h3 className="font-medium text-sm">{event.jobNumber}</h3>
                        <StatusBadge status={event.status} />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{event.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(event.start).toLocaleDateString()} • {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Aucun rendez-vous à venir</p>
                )}
              </div>
              
              {/* Legend */}
              <div className="mt-6 border-t pt-4">
                <h3 className="text-sm font-medium mb-2">Types de service</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-indigo-600 mr-2"></div>
                    <span className="text-xs text-gray-600">Garantie</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                    <span className="text-xs text-gray-600">Assurance</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
                    <span className="text-xs text-gray-600">Service régulier</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
