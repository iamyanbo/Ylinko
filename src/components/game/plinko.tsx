import { useEffect, useRef } from "react";
import { Engine, Render, World, Bodies, Body, Runner } from "matter-js";
import Matter from "matter-js";

function Plinko() {
    const scene = useRef<HTMLDivElement>(null);
    const engine = Engine.create();

    useEffect(() => {
        const render = Render.create({
            element: scene.current!,
            engine: engine,
            options: {
                width: 800,
                height: 600,
                wireframes: false,
            },
        });


        World.add(engine.world, [
            Bodies.rectangle(400, 600, 800, 50, { isStatic: true }),
            Bodies.rectangle(800, 300, 50, 600, { isStatic: true }),
            Bodies.rectangle(0, 300, 50, 600, { isStatic: true }),
        ]);

        const createPyramid = (start: number, y: number, levels: number, radius: number, gap: number) => {
            for (let i = 0; i < levels; i++) {
                for (let j = 0; j <= i; j++) {
                    const newObstacle = Bodies.circle(start + (j * (radius * 2 + 2 * gap)), y + (i * (radius * 2 + gap)), radius, {
                        isStatic: true,
                        render: {
                            fillStyle: "white",
                        },
                    });
                    World.add(engine.world, [newObstacle]);
                }
                start = start - radius - gap;
            }
        };

        createPyramid(400, -7, 25, 5, 10);

        Matter.Runner.run(Runner.create(), engine);
        Render.run(render);

        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key === " ") { // Check if the pressed key is space
                spawnNewBall();
            }
        };

        // Add event listener for keydown event
        window.addEventListener("keydown", handleKeyPress);

        return () => {
            window.removeEventListener("keydown", handleKeyPress);
            Render.stop(render);
            Engine.clear(engine);
            World.clear(engine.world, false);
            render.canvas.remove();
            render.canvas = null as any;
            render.context = null as any;
            render.textures = {};
        }
    }, []);

    const spawnNewBall = () => {
        const ball = Bodies.circle(400, -9, 4, {
            restitution: 0.5,
            render: {
                fillStyle: "white",
            },
        });
        let initialForceAngle = Math.random() * Math.PI;
        const initialForceMagnitude = 0.00001;
        Matter.Body.applyForce(ball, ball.position, {
            x: initialForceMagnitude * Math.cos(initialForceAngle),
            y: initialForceMagnitude * Math.sin(initialForceAngle)    
        });
        Matter.Body.setMass(ball, 0.005);
        World.add(engine.world, [ball]);
    }

    return (
        <div>
            <h1>Plinko</h1>
            <div ref={scene} style={{ width: 800, height: 600 }}></div>
            <button onClick={spawnNewBall}>Drop a ball</button>
        </div>
    );
}

export default Plinko;