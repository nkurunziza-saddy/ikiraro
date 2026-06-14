import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { PageLayout } from "@/components";
import { TextEffect } from "@/components/ui";

export const Route = createFileRoute("/what")({
  component: RouteComponent,
});

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.23, 1, 0.32, 1] as any,
    },
  },
};

function RouteComponent() {
  return (
    <PageLayout mainClassName="pt-16 md:pt-32">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-20 md:space-y-32"
      >
        {/* Header: The Definition */}
        <motion.section
          variants={item}
          className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-16 gap-y-2 md:gap-y-8 items-start"
        >
          <header className="font-medium text-foreground tracking-tight">
            <TextEffect preset="fade-in-blur" per="char">
              Ikiraro
            </TextEffect>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="font-normal text-muted-foreground mt-0.5 tracking-normal"
            >
              /i.ki.ɾa.ɾo/ <span className="italic">noun</span>
            </motion.div>
          </header>
          <div className="space-y-4">
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex"
            >
              <span className="text-muted-foreground/60 mr-3 tabular-nums font-medium">1.</span>
              <span>
                A physical or abstract structure providing passage over an obstacle; a bridge.
              </span>
            </motion.p>
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex"
            >
              <span className="text-muted-foreground/60 mr-3 tabular-nums font-medium">2.</span>
              <span>
                A unified client-side architecture for fluid sign language computation, natively
                executed within the browser's sandbox.
              </span>
            </motion.p>
            <TextEffect
              preset="fade-in-blur"
              per="word"
              delay={1.2}
              className="pt-6 mt-6 border-t border-border/20"
            >
              Ikiraro represents a departure from the "recorded video" paradigm of accessibility. It
              treats sign language as a dynamic, computational system—moving the entire pipeline of
              translation, kinematics, and recognition from the server directly to the client edge.
            </TextEffect>
          </div>
        </motion.section>

        {/* Section: The Input Stratum */}
        <motion.section
          variants={item}
          className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-16 gap-y-2 md:gap-y-8"
        >
          <header className="font-medium text-foreground tracking-tight">
            <TextEffect preset="fade-in-blur" per="char" trigger={true}>
              The Input Stratum
            </TextEffect>
          </header>
          <div>
            <p>
              Communication begins at the edge. Ikiraro ingests three distinct streams: structured
              text, phonetic speech via the Web Speech API or local Whisper models, and
              high-frequency landmark data from user-facing cameras.
            </p>
            <div className="mt-8 space-y-6">
              <p>
                <strong className="font-medium text-foreground mr-2.5">
                  Acoustic Synchronization.
                </strong>
                Speech transcripts are tokenized and duration-synced in real time. The avatar's
                pacing dynamically rescales to match the prosody of the incoming audio stream.
              </p>
              <p>
                <strong className="font-medium text-foreground mr-2.5">Vision Latency.</strong>
                Hardware-accelerated pose estimation executes within dedicated Web Workers,
                isolating tensor calculations from the main thread to rigidly preserve a
                sixty-frame-per-second interface budget.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Section: The Linguistic Brain */}
        <motion.section
          variants={item}
          className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-16 gap-y-2 md:gap-y-8"
        >
          <header className="font-medium text-foreground tracking-tight">
            <TextEffect preset="fade-in-blur" per="char" trigger={true}>
              The Linguistic Brain
            </TextEffect>
          </header>
          <div className="space-y-6">
            <p>
              English syntax is inherently volatile, whereas ASL is deeply structural. The engine
              acts as a linguistic compiler, translating semantic intent into a deterministic
              SignGraph. This graph encodes Topic-Comment structures, Non-Manual Marker (NMM)
              tokens, and temporal aspect.
            </p>
            <p>
              A critical breakthrough lies in Episodic Spatial Memory. As pronouns are introduced,
              the system assigns them to three-dimensional anchors, termed Episodic Indices.
              Subsequent references automatically trigger directional signs toward these persisted
              spatial coordinates.
            </p>
            <div className="pt-2">
              <p>
                <strong className="font-medium text-foreground mr-2.5">
                  Velocity Plateau Detection.
                </strong>
                Unlike traditional systems that wait for a sign to fully conclude, algorithmic
                plateau detection identifies the near-zero velocity "Hold" phase between signs. By
                firing events during deceleration, we eliminate retraction delay, enabling truly
                real-time conversation.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Section: The Kinematic Body */}
        <motion.section
          variants={item}
          className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-16 gap-y-2 md:gap-y-8"
        >
          <header className="font-medium text-foreground tracking-tight">
            <TextEffect preset="fade-in-blur" per="char" trigger={true}>
              The Kinematic Body
            </TextEffect>
          </header>
          <div>
            <p>
              To replicate the motor signature of human hands, the avatar's joints are driven by
              dual-spring kinematics. The Reach Spring handles the ballistic trajectory of the arm,
              while the highly damped Shape Spring governs fine finger flexion. Integrated with
              substepped physics, motion remains smooth and independent of variable CPU load.
            </p>
            <div className="mt-8 space-y-6">
              <p>
                <strong className="font-medium text-foreground mr-2.5">
                  Coarticulation Pathing.
                </strong>
                The system utilizes Procrustes alignment to calculate the shortest mathematical path
                between sign exit and entry poses, blending them seamlessly via a standardized
                cubic-Bézier easing function.
              </p>
              <p>
                <strong className="font-medium text-foreground mr-2.5">
                  Fingerspelling Cadence.
                </strong>
                Modeled upon real-world median datasets, letters are paced precisely at two hundred
                milliseconds, accompanied by a dedicated micro-pulse to ensure distinct visual
                separation.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Section: The Render Loop */}
        <motion.section
          variants={item}
          className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-16 gap-y-2 md:gap-y-8"
        >
          <header className="font-medium text-foreground tracking-tight">
            <TextEffect preset="fade-in-blur" per="char" trigger={true}>
              The Render Loop
            </TextEffect>
          </header>
          <div>
            <p>
              Rendering sign language demands surgical precision over bone transforms. During each
              frame, the system executes three discrete layers in a strict, non-negotiable hierarchy
              to entirely prevent animation overwriting.
            </p>
            <div className="mt-8 space-y-6">
              <p>
                <strong className="font-medium text-foreground mr-2.5">01. Base Mixer.</strong>
                Plays subtle idle motion capture, such as breathing and weight shifts, to maintain
                continuous biological realism.
              </p>
              <p>
                <strong className="font-medium text-foreground mr-2.5">
                  02. Inverse Kinematics.
                </strong>
                Forces the skeletal rig to reach the exact three-dimensional spatial targets
                mandated by the kinematic director.
              </p>
              <p>
                <strong className="font-medium text-foreground mr-2.5">
                  03. Handshape & Morph.
                </strong>
                Authoritatively overwrites finger quaternions and facial blendshapes to ensure
                absolute phonological clarity.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Section: Visual Inference */}
        <motion.section
          variants={item}
          className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-16 gap-y-2 md:gap-y-8"
        >
          <header className="font-medium text-foreground tracking-tight">
            <TextEffect preset="fade-in-blur" per="char" trigger={true}>
              Visual Inference
            </TextEffect>
          </header>
          <div>
            <p>
              Recognizing signs via a standard webcam is fundamentally a challenge of geometry. The
              inference engine employs Procrustes alignment to geometrically normalize
              landmarks—translating the wrist to the origin and scaling to unit distance—prior to
              scoring against templates derived from native signer data.
            </p>
            <div className="mt-8 space-y-6">
              <p>
                <strong className="font-medium text-foreground mr-2.5">
                  Chirality Invariance.
                </strong>
                Recognition logic mirrors templates in real time, natively supporting left-handed
                signers with zero additional configuration or performance penalty.
              </p>
              <p>
                <strong className="font-medium text-foreground mr-2.5">Stability Gating.</strong>A
                minimal, multi-frame stability gate aggressively filters out flicker errors,
                ensuring that only committed handshapes are finalized into the transcript.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Section: Accessibility & Control */}
        <motion.section
          variants={item}
          className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-16 gap-y-2 md:gap-y-8"
        >
          <header className="font-medium text-foreground tracking-tight">
            <TextEffect preset="fade-in-blur" per="char" trigger={true}>
              Accessibility & Control
            </TextEffect>
          </header>
          <div>
            <p>
              True accessibility demands flexible input modalities. The runtime architecture is
              built upon a unified event bus where inputs from any source—whether visual tracking,
              acoustic speech, or direct keyboard events—are normalized into strict, low-level
              operational commands.
            </p>
            <div className="mt-8 space-y-6">
              <p>
                <strong className="font-medium text-foreground mr-2.5">
                  Shortcut Infrastructure.
                </strong>
                The SDK ships with a dedicated Accessibility Shortcut Manager. It natively binds
                hardware keypresses to functional closures, automatically differentiating between
                single-tap and double-tap sequences to navigate the interface or trigger TTS output.
              </p>
              <p>
                <strong className="font-medium text-foreground mr-2.5">
                  Direct Modality Ingestion.
                </strong>
                Input is not constrained to graphical interfaces. The integrated Keyboard Plugin
                directly captures raw alphanumeric keypresses, converting them into linguistic
                tokens that bypass traditional UI layers and feed directly into the central
                translation compiler.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Section: Applications */}
        <motion.section
          variants={item}
          className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-x-16 gap-y-2 md:gap-y-8"
        >
          <header className="font-medium text-foreground tracking-tight">
            <TextEffect preset="fade-in-blur" per="char" trigger={true}>
              Applications
            </TextEffect>
          </header>
          <div>
            <p>
              Ikiraro is a computational primitive designed for deep integration. Because the entire
              pipeline operates natively within the browser, it can be embedded into existing
              digital ecosystems with absolute zero infrastructure overhead.
            </p>
            <div className="mt-8 space-y-6">
              <p>
                <strong className="font-medium text-foreground mr-2.5">Video Conferencing.</strong>
                Deploy real-time interpreted overlays for virtual meetings. The SDK consumes the
                identical video stream as the call, providing a sign language avatar that translates
                spoken dialogue with sub-second latency.
              </p>
              <p>
                <strong className="font-medium text-foreground mr-2.5">
                  Public Infrastructure.
                </strong>
                Enable high-availability accessibility in physical spaces. From transit hubs to
                government kiosks, the system provides a persistent, automated interpreter that
                functions entirely without a stable internet connection.
              </p>
              <p>
                <strong className="font-medium text-foreground mr-2.5">Digital Health.</strong>
                Facilitate private, compliant communication in clinical settings. On-device
                inference mathematically guarantees that sensitive medical dialogue never leaves the
                room, bridging the gap between clinicians and deaf patients.
              </p>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </PageLayout>
  );
}
