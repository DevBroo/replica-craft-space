import React from "react";
// import { Clock, Utensils } from "lucide-react";
// import { Badge } from "@/components/ui/badge";

interface ItineraryTimelineProps {
  itinerary: string;
  // propertyType: string;
  // packages?: Array<{
  //   start_time: string;
  //   end_time: string;
  //   meal_plan: string[];
  //   inclusions?: any[];
  //   duration_hours?: number;
  // }>;
}

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({
  // propertyType,
  // packages = []
  itinerary = "",
}) => {
  // Generate timeline based on packages or default for day picnic
  // const generateTimeline = () => {
  //   if (packages.length > 0) {
  //     const mainPackage = packages[0];
  //     const startTime = mainPackage.start_time;
  //     const endTime = mainPackage.end_time;
  //     const duration = mainPackage.duration_hours || 8;
  //     const mealPlans = mainPackage.meal_plan || [];

  //     const timeline = [
  //       {
  //         time: startTime || '09:00',
  //         title: 'Arrival & Welcome',
  //         description: 'Check-in and welcome refreshments',
  //         icon: '🎯'
  //       },
  //       {
  //         time: '10:00',
  //         title: 'Activities Begin',
  //         description: 'Start your day picnic experience with available activities',
  //         icon: '🎪'
  //       }
  //     ];

  //     // Add meal times based on meal plans
  //     if (mealPlans.includes('breakfast')) {
  //       timeline.push({
  //         time: '08:30',
  //         title: 'Breakfast',
  //         description: 'Fresh breakfast to start your day',
  //         icon: '🥞'
  //       });
  //     }

  //     if (mealPlans.includes('lunch')) {
  //       timeline.push({
  //         time: '12:30',
  //         title: 'Lunch',
  //         description: 'Delicious lunch with local specialties',
  //         icon: '🍽️'
  //       });
  //     }

  //     if (mealPlans.includes('snacks')) {
  //       timeline.push({
  //         time: '15:30',
  //         title: 'Evening Snacks',
  //         description: 'Light snacks and refreshments',
  //         icon: '☕'
  //       });
  //     }

  //     if (mealPlans.includes('dinner')) {
  //       timeline.push({
  //         time: '19:00',
  //         title: 'Dinner',
  //         description: 'Dinner under the stars',
  //         icon: '🌟'
  //       });
  //     }

  //     timeline.push({
  //       time: endTime || '17:00',
  //       title: 'Departure',
  //       description: 'Check-out and farewell',
  //       icon: '👋'
  //     });

  //     // Sort by time
  //     return timeline.sort((a, b) => a.time.localeCompare(b.time));
  //   }

  //   // Default timeline for day picnic
  //   return [
  //     {
  //       time: '09:00',
  //       title: 'Arrival & Welcome',
  //       description: 'Check-in and welcome refreshments',
  //       icon: '🎯'
  //     },
  //     {
  //       time: '10:00',
  //       title: 'Morning Activities',
  //       description: 'Outdoor games and activities',
  //       icon: '🎪'
  //     },
  //     {
  //       time: '12:30',
  //       title: 'Lunch Time',
  //       description: 'Delicious lunch with local specialties',
  //       icon: '🍽️'
  //     },
  //     {
  //       time: '14:00',
  //       title: 'Relaxation',
  //       description: 'Rest time and photo sessions',
  //       icon: '📸'
  //     },
  //     {
  //       time: '15:30',
  //       title: 'Evening Snacks',
  //       description: 'Light snacks and tea/coffee',
  //       icon: '☕'
  //     },
  //     {
  //       time: '17:00',
  //       title: 'Departure',
  //       description: 'Check-out and farewell',
  //       icon: '👋'
  //     }
  //   ];
  // };

  // const timeline = generateTimeline();

  // if (propertyType.toLowerCase() !== 'day picnic' && propertyType !== 'day_picnic') {
  //   return (
  //     <div className="text-center py-8">
  //       <p className="text-muted-foreground">Itinerary is only available for Day Picnic properties.</p>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6">
      <div dangerouslySetInnerHTML={{ __html: itinerary }}></div>
      {/* <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Day Picnic Itinerary</h3>
        <p className="text-muted-foreground">
          Here's what you can expect during your day picnic experience
        </p>
      </div> */}

      {/* <div className="relative"> */}
      {/* Timeline line */}
      {/* <div className="absolute left-8 top-0 bottom-0 w-px bg-border" /> */}

      {/* Timeline items */}
      {/* <div className="space-y-6">
          {timeline.map((item, index) => (
            <div key={index} className="relative flex items-start gap-4"> */}
      {/* Time badge */}
      {/* <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-background border-2 border-border rounded-full">
                <div className="text-center">
                  <div className="text-xs font-medium">{item.time}</div>
                </div>
              </div> */}

      {/* Content */}
      {/* <div className="flex-1 pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{item.icon}</span>
                  <h4 className="text-lg font-semibold">{item.title}</h4>
                </div>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div> */}

      {/* Meal plan badges */}
      {/* {packages.length > 0 && packages[0].meal_plan && packages[0].meal_plan.length > 0 && (
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Utensils className="h-5 w-5" />
            <h4 className="font-semibold">Included Meals</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {packages[0].meal_plan.map((meal, index) => (
              <Badge key={index} variant="secondary">
                {meal.charAt(0).toUpperCase() + meal.slice(1)}
              </Badge>
            ))}
          </div>
        </div>
      )} */}
    </div>
  );
};
