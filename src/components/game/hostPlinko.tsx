import React, { useCallback, useEffect, useState, useRef } from 'react';
import Peer from 'simple-peer';
import { v4 as uuidv4 } from 'uuid';
import * as CryptoJS from 'crypto-js';
import { Button, CircularProgress, Snackbar } from '@mui/material';
import { TextareaAutosize } from '@mui/base/TextareaAutosize';
import { Engine, Render, World, Bodies, Runner, Events } from "matter-js";
import Matter from "matter-js";
import BasicSpeedDial from "./speedDial";


function HostPlinko() {
    const [peer, setPeer] = useState(new Peer());
    const [data, setData] = useState('');
    const [open, setOpen] = useState(false);
    const [incoming, setIncoming] = useState('');
    const [connected, setConnected] = useState(false);
    const scene = useRef<HTMLDivElement>(null);
    const engineRef = useRef<any>(null as any);
    const [score, setScore] = useState(0);
    const [useCustom, setUseCustom] = useState(true);
    const [customValue, setCustomValue] = useState(1);
    const [balls, setBalls] = useState(100);
    const [percent, setPercent] = useState(1);
    const scene2 = useRef<HTMLDivElement>(null);
    const engineRef2 = useRef<any>(null as any);
    const [score2, setScore2] = useState(0);
    const [useCustom2, setUseCustom2] = useState(true);
    const [customValue2, setCustomValue2] = useState(1);
    const [balls2, setBalls2] = useState(100);
    const [percent2, setPercent2] = useState(1);
    const [randx, setRandx] = useState(0);
    const [peerRandx, setPeerRandx] = useState(0);

    const sendPeerData = useCallback((x: number, numBalls: number, val: number) => {
        if (peer && peer.connected) {
            // send all in JSON string
            peer.send(JSON.stringify({ x, numBalls, val }));
        }
    }, [peer]);

    const decrementBalls = useCallback((x: number) => {
        setBalls(prevBall => {
            sendPeerData(x, prevBall - customValue, customValue);
            return prevBall - customValue;
        });
    }, [customValue, sendPeerData]);

    const decrementBalls2 = useCallback(() => {
        setBalls2(prevBall => {
            console.log(prevBall - customValue2);
            return prevBall - customValue2;
        });
    }, [customValue2]);

    interface CustomBallDefinition extends Matter.IBodyDefinition {
        value: number;
    }

    const spawnNewBall = useCallback(() => {
        if (balls > 0 && customValue > 0) {
            let x = Math.random() * 40 + 380;
            console.log("x", x);
            const value = customValue;
            const ball = Bodies.circle(x, -9, 12, {
                restitution: 0.5,
                collisionFilter: {
                    group: -1,
                    mask: -1,
                },
                label: "ball",
                value: value,
            } as CustomBallDefinition);
            Matter.Body.setMass(ball, 0.005);
            console.log(engineRef.current!.world)
            World.add(engineRef.current!.world, [ball]);
            decrementBalls(x);
        }
    }, [decrementBalls, balls, customValue]);

    const spawnNewBall2 = useCallback((x: number, value: number) => {
        if (balls2 > 0 && value > 0) {
            const ball = Bodies.circle(x, -9, 12, {
                restitution: 0.5,
                collisionFilter: {
                    group: -1,
                    mask: -1,
                },
                label: "ball",
                value: value,
            } as CustomBallDefinition);
            Matter.Body.setMass(ball, 0.005);
            World.add(engineRef2.current!.world, [ball]);
            decrementBalls2();
        }
    }, [decrementBalls2, balls2]);
    
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key === " ") {
                spawnNewBall();
            }
        };

        window.addEventListener("keydown", handleKeyPress);
        return () => {
            window.removeEventListener("keydown", handleKeyPress);
        };
    }, [spawnNewBall]);

        useEffect(() => {
            // Update custom value based on percentage and balls
            if (!useCustom) {
                setCustomValue(Math.floor(balls * (percent / 100)));
            }
        }, [useCustom, percent, balls]);

    useEffect(() => {
        console.log("Initializing")
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
            Bodies.rectangle(826, 300, 50, 1000, { isStatic: true }),
            Bodies.rectangle(-26, 300, 50, 1000, { isStatic: true }),
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
                const multiplier = i / (halfNum - 1); // Linearly interpolate multiplier from 0 to 1
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
            const lightBlue = [110, 216, 300]; // RGB values for light blue
        
            const color = [
                Math.round((1 - multiplier) * purple[0] + multiplier * lightBlue[0]), // Interpolate red component
                Math.round((1 - multiplier) * purple[1] + multiplier * lightBlue[1]), // Interpolate green component
                Math.round((1 - multiplier) * purple[2] + multiplier * lightBlue[2])  // Interpolate blue component
            ];
        
            return `rgb(${color[0]},${color[1]},${color[2]})`;
        }
        const multipliers = [20, 10, 5, 2, 1, 0.5, 0.1, 0.1, 0.5, 1, 2, 5, 10, 20];

        const bottomCubes = createBottomCubes(30, 760, 14, 5, 52, multipliers);
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

        createPyramid(359, -60, 20, 5, 15.7, 30.5);

        Matter.Runner.run(Runner.create(), engine);
        Render.run(render);

        const collisions = new Set();

        const handleCollision = (event: Matter.IEventCollision<Matter.Engine>) => {
            const pairs = event.pairs;
            pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;
                if (bottomCubes.includes(bodyA)) {
                    if (collisions.has(bodyB.id)) {
                        console.log("Already collided");
                        return;
                    }
                    collisions.add(bodyB.id);
                    // Remove ball from the world
                    setScore(prevScore => prevScore + (bodyB as CustomBallDefinition).value * (bodyA as CustomBodyDefinition).multiplier);
                    World.remove(engine.world, bodyB);
                    // Log a message
                    const multiplier = (bodyA as CustomBodyDefinition).multiplier;
                    console.log(multiplier);
                } else if (bottomCubes.includes(bodyB)) {
                    if (collisions.has(bodyA.id)) {
                        console.log("Already collided");
                        return;
                    }
                    collisions.add(bodyA.id);
                    // Remove ball from the world
                    setScore(prevScore => prevScore + (bodyA as CustomBallDefinition).value * (bodyB as CustomBodyDefinition).multiplier);
                    World.remove(engine.world, bodyA);
                    // Log a message
                    const multiplier = (bodyB as CustomBodyDefinition).multiplier;
                    console.log(multiplier);
                }
            });
        };

        Events.on(engine, 'beforeUpdate', () => {
            const bodies = engine.world.bodies;
            bodies.forEach((body: any) => {
                if (body.label === "ball") {
                    const x = body.position.x;
                    const color = getColorFromPosition(x);
                    body.render.fillStyle = color;
                }
            });
        });

        function getColorFromPosition(x: number) {
            const center = 400; // Half of the canvas width
            const distance = Math.abs(x - center); // Distance from the center
            const maxDistance = center; // Maximum distance (from center to edge)
            
            // Interpolate between purple and light blue based on the normalized distance
            const purple = [148, 0, 211]; // RGB values for purple
            const lightBlue = [110, 216, 300]; // RGB values for light blue
            
            const red = Math.round((distance / maxDistance) * purple[0] + ((maxDistance - distance) / maxDistance) * lightBlue[0]);
            const green = Math.round((distance / maxDistance) * purple[1] + ((maxDistance - distance) / maxDistance) * lightBlue[1]);
            const blue = Math.round((distance / maxDistance) * purple[2] + ((maxDistance - distance) / maxDistance) * lightBlue[2]);
        
            return `rgb(${red},${green},${blue})`;
        }

        Events.on(engine, 'collisionStart', handleCollision);

        return () => {
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
    }, []);

    useEffect(() => {
        console.log("Initializing")
        engineRef2.current = Engine.create();
        const engine = engineRef2.current;
        const render = Render.create({
            element: scene2.current!,
            engine: engine,
            options: {
                width: 800,
                height: 800,
                wireframes: false,
            },
        });
        engine.timing.isFixed = false;

        World.add(engine.world, [
            Bodies.rectangle(826, 300, 50, 1000, { isStatic: true }),
            Bodies.rectangle(-26, 300, 50, 1000, { isStatic: true }),
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
                const multiplier = i / (halfNum - 1); // Linearly interpolate multiplier from 0 to 1
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
            const lightBlue = [110, 216, 300]; // RGB values for light blue

            const color = [
                Math.round((1 - multiplier) * purple[0] + multiplier * lightBlue[0]), // Interpolate red component
                Math.round((1 - multiplier) * purple[1] + multiplier * lightBlue[1]), // Interpolate green component
                Math.round((1 - multiplier) * purple[2] + multiplier * lightBlue[2])  // Interpolate blue component
            ];

            return `rgb(${color[0]},${color[1]},${color[2]})`;
        }
        const multipliers = [20, 10, 5, 2, 1, 0.5, 0.1, 0.1, 0.5, 1, 2, 5, 10, 20];

        const bottomCubes = createBottomCubes(30, 760, 14, 5, 52, multipliers);
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

        createPyramid(359, -60, 20, 5, 15.7, 30.5);

        Matter.Runner.run(Runner.create(), engine);
        Render.run(render);

        const collisions = new Set();

        const handleCollision = (event: Matter.IEventCollision<Matter.Engine>) => {
            const pairs = event.pairs;
            pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;
                if (bottomCubes.includes(bodyA)) {
                    if (collisions.has(bodyB.id)) {
                        console.log("Already collided");
                        return;
                    }
                    collisions.add(bodyB.id);
                    // Remove ball from the world
                    setScore2(prevScore => prevScore + (bodyB as CustomBallDefinition).value * (bodyA as CustomBodyDefinition).multiplier);
                    World.remove(engine.world, bodyB);
                    // Log a message
                    const multiplier = (bodyA as CustomBodyDefinition).multiplier;
                    console.log(multiplier);
                } else if (bottomCubes.includes(bodyB)) {
                    if (collisions.has(bodyA.id)) {
                        console.log("Already collided");
                        return;
                    }
                    collisions.add(bodyA.id);
                    // Remove ball from the world
                    setScore2(prevScore => prevScore + (bodyA as CustomBallDefinition).value * (bodyB as CustomBodyDefinition).multiplier);
                    World.remove(engine.world, bodyA);
                    // Log a message
                    const multiplier = (bodyB as CustomBodyDefinition).multiplier;
                    console.log(multiplier);
                }
            });
        };

        Events.on(engine, 'beforeUpdate', () => {
            const bodies = engine.world.bodies;
            bodies.forEach((body: any) => {
                if (body.label === "ball") {
                    const x = body.position.x;
                    const color = getColorFromPosition(x);
                    body.render.fillStyle = color;
                }
            });
        });

        function getColorFromPosition(x: number) {
            const center = 400; // Half of the canvas width
            const distance = Math.abs(x - center); // Distance from the center
            const maxDistance = center; // Maximum distance (from center to edge)

            // Interpolate between purple and light blue based on the normalized distance
            const purple = [148, 0, 211]; // RGB values for purple
            const lightBlue = [110, 216, 300]; // RGB values for light blue

            const red = Math.round((distance / maxDistance) * purple[0] + ((maxDistance - distance) / maxDistance) * lightBlue[0]);
            const green = Math.round((distance / maxDistance) * purple[1] + ((maxDistance - distance) / maxDistance) * lightBlue[1]);
            const blue = Math.round((distance / maxDistance) * purple[2] + ((maxDistance - distance) / maxDistance) * lightBlue[2]);

            return `rgb(${red},${green},${blue})`;
        }

        Events.on(engine, 'collisionStart', handleCollision);

        return () => {
            Events.off(engine, 'collisionStart', handleCollision);
            Render.stop(render);
            Runner.stop(Runner.create());
            Engine.clear(engine);
            World.clear(engine.world, false);
            render.canvas.remove();
            render.canvas = null as any;
            render.context = null as any;
            render.textures = {};
            engineRef2.current = null;
        }
    }, []);

    const setCustom = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUseCustom(event.target.checked);
    }

    const setValue = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCustomValue(Math.floor(Number(event.target.value)));
        setUseCustom(true);
    }

    const setPercentage1 = () => {
        setPercent(1);
        setCustomValue(Math.floor(balls * 0.01));
        setUseCustom(false);
    }

    const setPercentage5 = () => {
        setPercent(5);
        setCustomValue(Math.floor(balls * 0.05));
        setUseCustom(false);
    }

    const setPercentage10 = () => {
        setPercent(10);
        setCustomValue(Math.floor(balls * 0.1));
        setUseCustom(false);
    }

    useEffect(() => {
        if (customValue > balls) {
            setCustomValue(balls);
        }
        if (customValue < 0) {
            setCustomValue(0);
        }
    }, [customValue, balls]);

    useEffect(() => {
        // Generate a 8 character game code
        const code = uuidv4().substring(0, 8);
        const p = (peer && peer.connected) ? peer : new Peer({
            initiator: true,
            trickle: false,
        });
        console.log("peer", p);

        if (!peer.connected) {
            setPeer(p);
        }

        p.on('signal', (data) => {
            const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), code).toString();
            const encryptedData = encrypted + code;
            setData(encryptedData);
        });

        p.on('data', (data) => {
            console.log('Data', data);
            const decoded = new TextDecoder().decode(data);
            // its in form of x, numBalls, val, in JSON string
            try {
                const parsed = JSON.parse(decoded);
                console.log("parsed", parsed);
                setPeerRandx(parsed.x);
                spawnNewBall2(parsed.x, parsed.val);
                setCustomValue2(parsed.val);
                setBalls2(parsed.numBalls);
            } catch(e){
                console.log("error", e);
            }
        });

        p.on('connect', () => {
            setConnected(true);
        });

        p.on('close', () => {
            console.log('Connection closed');
            setConnected(false);
        });

        p.on('error', (err) => {
            console.log('Error', err);
        });
    }, [spawnNewBall2]);

    const handleClick = () => {
        // copy data to clipboard
        navigator.clipboard.writeText(data);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    }

    const updateIncoming = (e: any) => {
        setIncoming(e.target.value);
    }

    const handleSubmit = (e: any) => {
        e.preventDefault();
        let incomingData = incoming.trim();
        try {
            const gameCode = incomingData.substring(incomingData.length - 8);
            const encoded = incomingData.substring(0, incomingData.length - 8);
            console.log("encoded", encoded);
            console.log("gameCode", gameCode);
            const decrypted = CryptoJS.AES.decrypt(encoded, gameCode).toString(CryptoJS.enc.Utf8);
            peer.signal(JSON.parse(decrypted));
        } catch (e) {
            console.log("error", e);
        }
    }

    return (
        <div>
            {data && data.length > 0 ? (
                <div className='flex flex-col items-center'>
                    <Button onClick={handleClick}
                        variant='contained'
                        color='primary'
                        className='mb-4'
                    >Copy Code</Button>
                    <Snackbar
                        open={open}
                        autoHideDuration={3000}
                        onClose={handleClose}
                        message="Copied to clipboard!"
                    />
                </div>
            ) : (
                <div>
                    <CircularProgress />
                    <p>Generating Code</p>
                </div>
            )}
            <form>
                <TextareaAutosize 
                    onChange={updateIncoming}
                    className=''
                    maxRows={3}
                />
                <button onClick={handleSubmit}
                >submit</button>
            </form>
            <div className="flex flex-row items-center justify-center w-full bg-black h-full">
                <div className="flex flex-col items-center justify-center" style={{ width: 200 }}>
                    <div className="flex flex-col items-center justify-center mb-4">
                        <p className="text-2xl text-white">Balls: {balls2.toFixed(1)}</p>
                        <p className="text-2xl text-white">Score: {score2.toFixed(1)}</p>
                        <p className = "text-2xl text-white">value: {customValue2.toFixed(1)}</p>
                    </div>
                </div>
                <div ref={scene2} style={{ width: 800, height: 800, margin: "1em" }}></div>
                <div ref={scene} style={{ width: 800, height: 800, margin: "1em" }}></div>
                <div className="flex flex-col items-center justify-center" style={{ width: 200 }}>
                    <div className="flex flex-col items-center justify-center mb-4">
                        <p className="text-2xl text-white">Balls: {balls.toFixed(1)}</p>
                        <p className="text-2xl text-white">Score: {score.toFixed(1)}</p>
                    </div>
                    <button className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-500 to-pink-500 group-hover:from-purple-500 group-hover:to-pink-500 hover:text-white dark:text-white focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 ${isClicked ? 'ring-transparent' : 'ring-4 ring-purple-200 dark:ring-purple-800"
                    onClick={spawnNewBall}
                    >
                        <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
                            Drop Ball
                        </span>
                    </button>
                    <button className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 hover:text-white dark:text-white focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800"
                        onClick={setPercentage1}
                    >
                        <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
                            1%
                        </span>
                    </button>
                    <button className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 hover:text-white dark:text-white focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800"
                        onClick={setPercentage5}
                    >
                        <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
                            5%
                        </span>
                    </button>
                    <button className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 hover:text-white dark:text-white focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800"
                        onClick={setPercentage10}
                    >
                        <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
                            10%
                        </span>
                    </button>
                    <input type="number" className="w-20 h-10 px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800" 
                        min={0}
                        max={balls}
                        step={1}
                        onChange={setValue}
                        placeholder="Custom"
                        value={customValue}
                    />
                    <input type="checkbox" className="mt-2 w-5 h-5 text-purple-600 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800" 
                        onChange={setCustom}
                        id="checkbox"
                        checked={useCustom}
                    />
                    <label htmlFor="checkbox" className="mt-2 text-sm text-white">
                        Use custom
                    </label>
                    <BasicSpeedDial />
                </div>
            </div>

        </div>
    );
}

export default HostPlinko;