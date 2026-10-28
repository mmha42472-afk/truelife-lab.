import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"

/** Red blood cell profile (Evans–Fung biconcave disc), normalised to radius 1 */
function rbcGeometry() {
  const pts: THREE.Vector2[] = []
  const N = 48
  const half = (x: number) => 0.5 * Math.sqrt(Math.max(0, 1 - x * x)) * (0.207 + 2.0 * x * x - 1.12 * x ** 4)
  for (let i = 0; i <= N; i++) { const a = (i / N) * (Math.PI / 2); const x = Math.sin(a); pts.push(new THREE.Vector2(x, -half(x) - 0.001 * Math.cos(a))) }
  for (let i = N - 1; i >= 0; i--) { const a = (i / N) * (Math.PI / 2); const x = Math.sin(a); pts.push(new THREE.Vector2(x, half(x) + 0.001 * Math.cos(a))) }
  return new THREE.LatheGeometry(pts, 64)
}

/** Teardrop profile: rounded bottom, pointed top */
function dropGeometry() {
  const pts: THREE.Vector2[] = []
  const N = 80
  for (let i = N; i >= 0; i--) {
    const t = (i / N) * Math.PI
    pts.push(new THREE.Vector2(Math.sin(t) * (1 - Math.cos(t)) * 0.5, Math.cos(t) * 1.05))
  }
  return new THREE.LatheGeometry(pts, 96)
}

export default function CellScene({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
    const small = matchMedia("(max-width: 640px)").matches

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" })
    } catch { setFailed(true); return }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.92
    renderer.domElement.setAttribute("aria-hidden", "true")
    Object.assign(renderer.domElement.style, { position: "absolute", inset: "0", width: "100%", height: "100%", display: "block" })
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    camera.position.set(0, 0, 11)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = envTex

    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 5, 6); scene.add(key)
    const rim = new THREE.PointLight(0xff3355, 18, 20); rim.position.set(-4, -2, 3); scene.add(rim)
    scene.add(new THREE.HemisphereLight(0xffffff, 0xdde3ff, 0.6))

    const world = new THREE.Group(); scene.add(world)

    // Hero drop
    const dropGeo = dropGeometry()
    const dropMat = new THREE.MeshPhysicalMaterial({ color: 0xc0142e, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, sheen: 0.4, sheenColor: new THREE.Color(0xff8899) })
    const drop = new THREE.Mesh(dropGeo, dropMat)
    drop.scale.setScalar(small ? 1.25 : 1.45)
    world.add(drop)

    // Orbiting red blood cells
    const rbcGeo = rbcGeometry()
    const rbcMat = new THREE.MeshPhysicalMaterial({ color: 0xa80f26, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3, sheen: 0.6, sheenColor: new THREE.Color(0xff6b7d) })
    const count = small ? 9 : 14
    type Cell = { m: THREE.Mesh; r: number; a: number; s: number; y: number; z: number; spin: THREE.Vector3; ph: number }
    const cells: Cell[] = []
    const rand = (a: number, b: number) => a + Math.random() * (b - a)
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(rbcGeo, rbcMat)
      m.scale.setScalar(rand(0.42, 0.7))
      m.rotation.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI))
      const c: Cell = { m, r: rand(2.1, small ? 3.0 : 3.6), a: (i / count) * Math.PI * 2 + rand(-0.2, 0.2), s: rand(0.08, 0.18) * (Math.random() < 0.5 ? 1 : -1), y: rand(-1.6, 1.6), z: rand(-1.5, 1.2), spin: new THREE.Vector3(rand(-.5, .5), rand(-.6, .6), rand(-.4, .4)), ph: rand(0, 6.28) }
      cells.push(c); world.add(m)
    }

    // A few navy "white cells"
    const wbcMat = new THREE.MeshPhysicalMaterial({ color: 0x2a3590, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 })
    const wbcGeo = new THREE.IcosahedronGeometry(1, 4)
    const pos = wbcGeo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(pos, i); v.multiplyScalar(1 + 0.06 * Math.sin(v.x * 7) * Math.cos(v.y * 6)); pos.setXYZ(i, v.x, v.y, v.z) }
    wbcGeo.computeVertexNormals()
    const wbcs: { m: THREE.Mesh; base: THREE.Vector3; ph: number }[] = []
    const wbcSpots = [[-2.6, 1.7, -1], [2.7, -1.6, -0.6], [1.9, 2.0, -2], [-2.2, -2.0, 0.4]]
    wbcSpots.slice(0, small ? 2 : 4).forEach(([x, y, z], i) => {
      const m = new THREE.Mesh(wbcGeo, wbcMat); m.scale.setScalar(0.28 + i * 0.05)
      m.position.set(x, y, z); world.add(m); wbcs.push({ m, base: new THREE.Vector3(x, y, z), ph: i * 1.7 })
    })

    // Sizing
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight
      renderer.setSize(w, h, false); camera.aspect = w / h
      camera.position.z = w / h < 0.9 ? 12.5 : 10.8
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize); ro.observe(el); resize()

    // Pointer parallax
    const target = { x: 0, y: 0 }
    const onPointer = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 0.6
      target.y = (e.clientY / window.innerHeight - 0.5) * 0.4
    }
    window.addEventListener("pointermove", onPointer, { passive: true })

    // Visibility
    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { threshold: 0 })
    io.observe(el)

    const clock = new THREE.Clock()
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!visible || document.hidden) { clock.getDelta(); return }
      const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime
      drop.rotation.y += dt * 0.35
      drop.position.y = Math.sin(t * 1.1) * 0.12
      cells.forEach(c => {
        c.a += c.s * dt
        c.m.position.set(Math.cos(c.a) * c.r, c.y + Math.sin(t * 0.8 + c.ph) * 0.25, c.z + Math.sin(c.a) * 0.9)
        c.m.rotation.x += c.spin.x * dt; c.m.rotation.y += c.spin.y * dt; c.m.rotation.z += c.spin.z * dt
      })
      wbcs.forEach(w => { w.m.position.y = w.base.y + Math.sin(t * 0.9 + w.ph) * 0.2; w.m.rotation.y += dt * 0.3 })
      const sy = Math.min(window.scrollY / 800, 1)
      world.rotation.y += (target.x - world.rotation.y) * 0.05
      world.rotation.x += (target.y + sy * 0.35 - world.rotation.x) * 0.05
      renderer.render(scene, camera)
    }
    if (reduce) {
      cells.forEach(c => c.m.position.set(Math.cos(c.a) * c.r, c.y, c.z + Math.sin(c.a) * 0.9))
      renderer.render(scene, camera)
      const onR = () => renderer.render(scene, camera); ro.disconnect(); new ResizeObserver(() => { resize(); onR() }).observe(el)
    } else tick()

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect()
      window.removeEventListener("pointermove", onPointer)
      ;[dropGeo, rbcGeo, wbcGeo].forEach(g => g.dispose())
      ;[dropMat, rbcMat, wbcMat].forEach(m => m.dispose())
      envTex.dispose(); pmrem.dispose(); renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <div ref={ref} className={className}>
      {failed && <div className="grid h-full place-items-center text-muted-foreground">—</div>}
    </div>
  )
}
