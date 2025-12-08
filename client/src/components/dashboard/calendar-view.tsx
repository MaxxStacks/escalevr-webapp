import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarView() {
  const [currentDate] = useState(new Date());
  
  // Mois et jours en français
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", 
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  const currentMonth = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Calendrier à venir</h2>
        <button className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
          <span className="material-icons text-sm mr-1">calendar_today</span>
          Calendrier complet
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-center mb-4">
          <button className="p-1 text-gray-400 hover:text-gray-500">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="flex-1 text-center text-sm font-medium">{currentMonth} {currentYear}</h3>
          <button className="p-1 text-gray-400 hover:text-gray-500">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
          <div className="text-gray-500">Dim</div>
          <div className="text-gray-500">Lun</div>
          <div className="text-gray-500">Mar</div>
          <div className="text-gray-500">Mer</div>
          <div className="text-gray-500">Jeu</div>
          <div className="text-gray-500">Ven</div>
          <div className="text-gray-500">Sam</div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Calendar days would be generated dynamically based on the current month */}
          <div className="p-1 text-gray-400">24</div>
          <div className="p-1 text-gray-400">25</div>
          <div className="p-1 text-gray-400">26</div>
          <div className="p-1 text-gray-400">27</div>
          <div className="p-1 text-gray-400">28</div>
          <div className="p-1 text-gray-400">29</div>
          <div className="p-1 text-gray-400">30</div>
          <div className="p-1">1</div>
          <div className="p-1">2</div>
          <div className="p-1">3</div>
          <div className="p-1">4</div>
          <div className="p-1">5</div>
          <div className="p-1">6</div>
          <div className="p-1">7</div>
          <div className="p-1">8</div>
          <div className="p-1">9</div>
          <div className="p-1 rounded-full bg-primary-100 text-primary-700 font-medium">10</div>
          <div className="p-1 relative">
            11
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full"></div>
          </div>
          <div className="p-1 relative">
            12
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full"></div>
          </div>
          <div className="p-1 relative">
            13
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-secondary-500 rounded-full"></div>
          </div>
          <div className="p-1">14</div>
          <div className="p-1">15</div>
          <div className="p-1 relative">
            16
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full"></div>
          </div>
          <div className="p-1">17</div>
          <div className="p-1">18</div>
          <div className="p-1 relative">
            19
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-secondary-500 rounded-full"></div>
          </div>
          <div className="p-1 relative">
            20
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full"></div>
          </div>
          <div className="p-1">21</div>
        </div>
      </div>
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-700">Rendez-vous à venir</p>
          <div className="flex">
            <div className="flex-shrink-0 w-2 bg-primary-500 rounded-l"></div>
            <div className="flex-1 bg-white p-2 text-xs border border-l-0 rounded-r border-gray-200">
              <p className="font-medium">3 inspections PDI</p>
              <p className="text-gray-500">11-12 oct • Mike & David</p>
            </div>
          </div>
          <div className="flex">
            <div className="flex-shrink-0 w-2 bg-secondary-500 rounded-l"></div>
            <div className="flex-1 bg-white p-2 text-xs border border-l-0 rounded-r border-gray-200">
              <p className="font-medium">Événement d'hivernisation saisonnière</p>
              <p className="text-gray-500">13, 19 oct • Tous les techniciens</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
