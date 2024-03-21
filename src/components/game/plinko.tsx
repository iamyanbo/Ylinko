import { useCallback, useEffect, useRef } from "react";
import { Engine, Render, World, Bodies, Runner, Events } from "matter-js";
import Matter from "matter-js";
import { get } from "http";

function Plinko() {
    const scene = useRef<HTMLDivElement>(null);
    const engineRef = useRef<any>(null as any);
    const blue = "#0000ff";
    const purple = "#800080";
    const spawnNewBall = useCallback(() => {
        let x = Math.random() * 40 + 380;
        const ball = Bodies.circle(x, -9, 12, {
            restitution: 0.5,
            collisionFilter: {
                group: -1,
                mask: -1,
            },
            render: {
                fillStyle: "white",
            },
        });
        Matter.Body.setMass(ball, 0.005);
        World.add(engineRef.current!.world, [ball]);
    }, []);

    useEffect(() => {
        engineRef.current = Engine.create();
        const engine = engineRef.current;
        const render = Render.create({
            element: scene.current!,
            engine: engine,
            options: {
                width: 800,
                height: 800,
                wireframes: false,
            },
        });
        engine.timing.isFixed = false;

        World.add(engine.world, [
            Bodies.rectangle(825, 300, 50, 1000, { isStatic: true }),
            Bodies.rectangle(-25, 300, 50, 1000, { isStatic: true }),
        ]);
        
        interface CustomBodyDefinition extends Matter.IChamferableBodyDefinition {
            multiplier: number;
        }

        const createBottomCubes = (x: number, y: number, num: number, gap: number, width: number, mults: number[]) => {
            const cubes: Matter.Body[] = [];
            const halfNum = Math.ceil(num / 2); // Number of cubes for each half
        
            // Create cubes for the left half (purple to light blue)
            for (let i = 0; i < halfNum; i++) {
                const multiplier = i / (halfNum - 1); // Linearly interpolate multiplier from 0 to 1
                const color = getColorForMultiplier(multiplier);
                const newCube = Bodies.rectangle(x + (i * (width + gap)), y, width, width, {
                    isStatic: true,
                    chamfer: { radius: 10 },
                    multiplier: mults[i],
                    render: {
                        fillStyle: color
                    },
                } as CustomBodyDefinition);
                cubes.push(newCube);
            }
        
            // Create cubes for the right half (light blue to purple)
            for (let i = halfNum - 1; i >= 0; i--) {
                const multiplier = i / (halfNum); // Linearly interpolate multiplier from 0 to 1
                const color = getColorForMultiplier(multiplier);
                const newCube = Bodies.rectangle(x + ((num - i - 1) * (width + gap)), y, width, width, {
                    isStatic: true,
                    chamfer: { radius: 10 },
                    multiplier: mults[i],
                    render: {
                        fillStyle: color
                    },
                } as CustomBodyDefinition);
                cubes.push(newCube);
            }
        
            return cubes;
        }
        
        // Helper function to generate color based on multiplier
        function getColorForMultiplier(multiplier: number): string {
            // Interpolate between purple and light blue or between light blue and purple
            const purple = [148, 0, 211]; // RGB values for purple
            const lightBlue = [173, 216, 230]; // RGB values for light blue
        
            const color = [
                Math.round((1 - multiplier) * purple[0] + multiplier * lightBlue[0]), // Interpolate red component
                Math.round((1 - multiplier) * purple[1] + multiplier * lightBlue[1]), // Interpolate green component
                Math.round((1 - multiplier) * purple[2] + multiplier * lightBlue[2])  // Interpolate blue component
            ];
        
            return `rgb(${color[0]},${color[1]},${color[2]})`;
        }

        const multipliers = [20, 10, 5, 2, 1, 0.5, 0.3, 0.1, 0.3, 0.5, 1, 2, 5, 10, 20];
        const bottomCubes = createBottomCubes(30, 750, 15, 5, 52, multipliers);
        World.add(engine.world, bottomCubes);

        const createPyramid = (start: number, y: number, levels: number, radius: number, xGap: number, yGap: number = 0) => {
            for (let i = 2; i < levels; i++) {
                for (let j = 0; j <= i; j++) {
                    const newObstacle = Bodies.circle(start + (j * (radius * 2 + 2 * xGap)), y + (i * (radius * 2 + yGap)), radius, {
                        isStatic: true,
                        render: {
                            fillStyle: "white",
                        },
                    });
                    World.add(engine.world, [newObstacle]);
                }
                start -= radius + xGap;
            }
        };

        createPyramid(360, -60, 20, 5, 15.5, 30);

        Matter.Runner.run(Runner.create(), engine);
        Render.run(render);

        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key === " ") {
                spawnNewBall();
            }
        };

        window.addEventListener("keydown", handleKeyPress);

        const handleCollision = (event: Matter.IEventCollision<Matter.Engine>) => {
            const pairs = event.pairs;
    
            pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;
    
                if (bottomCubes.includes(bodyA)) {
                    // Remove ball from the world
                    World.remove(engine.world, bodyB);
                    // Log a message
                    console.log("Ball removed");
                    const multiplier = (bodyA as CustomBodyDefinition).multiplier;
                    console.log(multiplier);
                } else if (bottomCubes.includes(bodyB)) {
                    // Remove ball from the world
                    World.remove(engine.world, bodyA);
                    // Log a message
                    console.log("Ball removed");
                    const multiplier = (bodyB as CustomBodyDefinition).multiplier;
                    console.log(multiplier);
                }
            });
        };

        Events.on(engine, 'collisionStart', handleCollision);

        return () => {
            window.removeEventListener("keydown", handleKeyPress);
            Events.off(engine, 'collisionStart', handleCollision);
            Render.stop(render);
            Runner.stop(Runner.create());
            Engine.clear(engine);
            World.clear(engine.world, false);
            render.canvas.remove();
            render.canvas = null as any;
            render.context = null as any;
            render.textures = {};
            engineRef.current = null;
        }
    }, [spawnNewBall]);


    return (
        <div>
            <h1>Plinko</h1>
            <div ref={scene} style={{ width: 800, height: 600 }}></div>
            <button onClick={spawnNewBall}>Drop a ball</button>
        </div>
    );
}

export default Plinko;