export interface GardenObject {
  name: string;
  label: string;
  cost: number;
  image: number;
}

export const GARDEN_OBJECTS: GardenObject[] = [
  { name: 'obj_bench',      label: 'Bench',      cost: 5,  image: require('@assets/garden/obj_bench.png') },
  { name: 'obj_birdhouse',  label: 'Birdhouse',  cost: 8,  image: require('@assets/garden/obj_birdhouse.png') },
  { name: 'obj_butterfly',  label: 'Butterfly',  cost: 12, image: require('@assets/garden/obj_butterfly.png') },
  { name: 'obj_fountain',   label: 'Fountain',   cost: 20, image: require('@assets/garden/obj_fountain.png') },
  { name: 'obj_lantern',    label: 'Lantern',    cost: 15, image: require('@assets/garden/obj_lantern.png') },
  { name: 'obj_path',       label: 'Path',       cost: 3,  image: require('@assets/garden/obj_path.png') },
  { name: 'obj_rose_hedge', label: 'Rose Hedge', cost: 18, image: require('@assets/garden/obj_rose_hedge.png') },
  { name: 'obj_tree',       label: 'Tree',       cost: 10, image: require('@assets/garden/obj_tree.png') },
];
